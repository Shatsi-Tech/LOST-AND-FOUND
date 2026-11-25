import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { AuthRequest, authenticateToken, requireRole, logAudit } from '../middleware/auth.js';

const router = Router();

async function generateHandoverReference(): Promise<string> {
  const year = new Date().getFullYear();
  const countRow = await db.prepare('SELECT COUNT(*) as count FROM handovers').get() as any;
  const count = Number(countRow?.count || 0);
  const seq = (count + 1).toString().padStart(4, '0');
  return `HAND-${year}-${seq}`;
}

// GET /api/handovers/lookup - Lookup approved claim by collection reference or student ID
router.get('/lookup', authenticateToken, requireRole('officer', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { reference } = req.query;

    if (!reference) {
      return res.status(400).json({ error: 'Collection reference or student ID is required' });
    }

    const term = String(reference).trim();

    // Query for approved claim
    const claim = await db.prepare(`
      SELECT c.*, 
             f.item_name as found_name, f.item_reference as found_reference, f.color as found_color,
             f.description as found_description, f.current_storage_location, f.image_url as found_image,
             f.status as found_status,
             cat.name as category_name, loc.name as location_name,
             u.full_name as recipient_name, u.student_staff_id as recipient_student_id,
             u.email as recipient_email, u.phone as recipient_phone, u.department as recipient_department
      FROM claims c
      JOIN found_items f ON c.found_item_id = f.id
      JOIN users u ON c.claimant_id = u.id
      LEFT JOIN categories cat ON f.category_id = cat.id
      LEFT JOIN locations loc ON f.location_id = loc.id
      WHERE (upper(c.claim_reference) = upper(?) OR upper(u.student_staff_id) = upper(?))
      ORDER BY CASE c.status WHEN 'Approved' THEN 1 ELSE 2 END, c.created_at DESC
      LIMIT 1
    `).get(term, term) as any;

    if (!claim) {
      return res.status(404).json({ error: 'No claim found matching this reference or student ID' });
    }

    // Check if already handed over
    const existingHandover = await db.prepare('SELECT * FROM handovers WHERE claim_id = ?').get(claim.id);

    return res.json({ claim, handover: existingHandover || null });
  } catch (err: any) {
    return res.status(500).json({ error: 'Lookup failed' });
  }
});

// POST /api/handovers - Record physical handover and mark returned
router.post('/', authenticateToken, requireRole('officer', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { claim_id, id_verified, notes, signature_name } = req.body;

    if (!claim_id) {
      return res.status(400).json({ error: 'Claim ID is required' });
    }

    const claim = await db.prepare(`
      SELECT c.*, f.item_name as found_name, f.item_reference as found_reference, f.id as found_item_id
      FROM claims c
      JOIN found_items f ON c.found_item_id = f.id
      WHERE c.id = ?
    `).get(claim_id) as any;

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    if (claim.status !== 'Approved') {
      return res.status(400).json({ error: 'Cannot handover an item without an Approved claim status' });
    }

    // Check if already handed over
    const existing = await db.prepare('SELECT id FROM handovers WHERE claim_id = ?').get(claim.id);
    if (existing) {
      return res.status(409).json({ error: 'This item has already been marked as returned / handed over.' });
    }

    const handoverId = 'hand_' + crypto.randomBytes(8).toString('hex');
    const handover_reference = await generateHandoverReference();
    const now = new Date();
    const handover_date = now.toISOString().split('T')[0];
    const handover_time = now.toTimeString().split(' ')[0].substring(0, 5);

    // Insert handover record
    await db.prepare(`
      INSERT INTO handovers (
        id, handover_reference, claim_id, found_item_id, recipient_id,
        officer_id, handover_date, handover_time, id_verified, status, notes, signature_name, created_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, 'Completed', ?, ?, datetime('now')
      )
    `).run(
      handoverId,
      handover_reference,
      claim.id,
      claim.found_item_id,
      claim.claimant_id,
      req.user!.id,
      handover_date,
      handover_time,
      id_verified ? 1 : 1,
      notes ? notes.trim() : null,
      signature_name ? signature_name.trim() : null
    );

    // Update Found Item status to 'Returned'
    await db.prepare('UPDATE found_items SET status = \'Returned\', updated_at = datetime(\'now\') WHERE id = ?').run(claim.found_item_id);

    // If there is an associated lost item, update its status to 'Returned'
    if (claim.lost_item_id) {
      await db.prepare('UPDATE lost_items SET status = \'Returned\', updated_at = datetime(\'now\') WHERE id = ?').run(claim.lost_item_id);
    } else {
      await db.prepare(`
        UPDATE lost_items 
        SET status = 'Returned', updated_at = datetime('now') 
        WHERE id IN (
          SELECT m.lost_item_id FROM matches m 
          WHERE m.found_item_id = ? AND m.lost_item_id IN (SELECT id FROM lost_items WHERE reporter_id = ?)
        )
      `).run(claim.found_item_id, claim.claimant_id);
    }

    await logAudit(
      req.user!.id,
      req.user!.full_name,
      'ITEM_HANDOVER',
      'handover',
      handoverId,
      `Handover #${handover_reference} completed for item #${claim.found_reference} to student #${claim.claimant_id}`
    );

    // Send final congratulatory recovery notification to the claimant
    await db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, notification_type, link)
      VALUES (?, ?, ?, ?, 'handover', ?)
    `).run(
      'notif_' + crypto.randomBytes(8).toString('hex'),
      claim.claimant_id,
      'Item Successfully Recovered!',
      `Your item "${claim.found_name}" has been officially handed over to you (Handover Ref: #${handover_reference}). Thank you for using Apex Campus Lost & Found.`,
      '/dashboard/claims'
    );

    const fullHandover = await db.prepare(`
      SELECT h.*, 
             f.item_name as found_name, f.item_reference as found_reference,
             u.full_name as recipient_name, u.student_staff_id as recipient_student_id,
             officer.full_name as officer_name
      FROM handovers h
      JOIN found_items f ON h.found_item_id = f.id
      JOIN users u ON h.recipient_id = u.id
      JOIN users officer ON h.officer_id = officer.id
      WHERE h.id = ?
    `).get(handoverId);

    return res.status(201).json({
      message: 'Item handover recorded successfully. Item is marked as Returned.',
      handover: fullHandover,
    });
  } catch (err: any) {
    console.error('Handover error:', err);
    return res.status(500).json({ error: 'Failed to record handover' });
  }
});

// GET /api/handovers - List return history
router.get('/', authenticateToken, requireRole('officer', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { query, start_date, end_date, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT h.*, 
             f.item_name as found_name, f.item_reference as found_reference, f.color as found_color,
             f.image_url as found_image,
             cat.name as category_name, loc.name as location_name,
             c.claim_reference,
             u.full_name as recipient_name, u.student_staff_id as recipient_student_id, u.email as recipient_email,
             officer.full_name as officer_name, officer.student_staff_id as officer_staff_id
      FROM handovers h
      JOIN claims c ON h.claim_id = c.id
      JOIN found_items f ON h.found_item_id = f.id
      JOIN users u ON h.recipient_id = u.id
      JOIN users officer ON h.officer_id = officer.id
      LEFT JOIN categories cat ON f.category_id = cat.id
      LEFT JOIN locations loc ON f.location_id = loc.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (query) {
      sql += ` AND (h.handover_reference ILIKE ? OR c.claim_reference ILIKE ? OR f.item_name ILIKE ? OR u.full_name ILIKE ? OR u.student_staff_id ILIKE ?)`;
      const q = `%${query}%`;
      params.push(q, q, q, q, q);
    }
    if (start_date) {
      sql += ` AND h.handover_date >= ?`;
      params.push(start_date);
    }
    if (end_date) {
      sql += ` AND h.handover_date <= ?`;
      params.push(end_date);
    }

    sql += ` ORDER BY h.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const handovers = await db.prepare(sql).all(...params);
    return res.json({ handovers });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve handover history' });
  }
});

export default router;
