import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { AuthRequest, authenticateToken, requireRole, logAudit } from '../middleware/auth.js';

const router = Router();

async function generateClaimReference(): Promise<string> {
  const year = new Date().getFullYear();
  const countRow = await db.prepare('SELECT COUNT(*) as count FROM claims').get() as any;
  const count = Number(countRow?.count || 0);
  const seq = (count + 1).toString().padStart(5, '0');
  return `CLAIM-${year}-${seq}`;
}

// POST /api/claims - Submit an Ownership Claim
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { found_item_id, lost_item_id, ownership_evidence, identifying_marks, purchase_info } = req.body;

    if (!found_item_id || !ownership_evidence) {
      return res.status(400).json({ error: 'Found item ID and ownership evidence are required' });
    }

    const foundItem = await db.prepare('SELECT * FROM found_items WHERE id = ?').get(found_item_id) as any;
    if (!foundItem) {
      return res.status(404).json({ error: 'Found item does not exist' });
    }

    if (foundItem.status === 'Returned' || foundItem.status === 'Archived') {
      return res.status(400).json({ error: 'This item is no longer available for claims.' });
    }

    // Check if user already submitted an active claim for this found item
    const existingClaim = await db.prepare(`
      SELECT id, status FROM claims 
      WHERE found_item_id = ? AND claimant_id = ? AND status IN ('Pending', 'Under Review', 'Approved')
    `).get(found_item_id, req.user!.id) as any;

    if (existingClaim) {
      return res.status(409).json({ error: 'You have already submitted an active claim for this item.' });
    }

    const claimId = 'claim_' + crypto.randomBytes(8).toString('hex');
    const claim_reference = await generateClaimReference();

    await db.prepare(`
      INSERT INTO claims (
        id, claim_reference, found_item_id, lost_item_id, claimant_id,
        ownership_evidence, identifying_marks, purchase_info, status,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, 'Pending',
        datetime('now'), datetime('now')
      )
    `).run(
      claimId,
      claim_reference,
      found_item_id,
      lost_item_id || null,
      req.user!.id,
      ownership_evidence.trim(),
      identifying_marks ? identifying_marks.trim() : null,
      purchase_info ? purchase_info.trim() : null
    );

    // Update found item status to 'Under Verification' if still 'Found'
    if (foundItem.status === 'Found') {
      await db.prepare('UPDATE found_items SET status = \'Under Verification\', updated_at = datetime(\'now\') WHERE id = ?').run(found_item_id);
    }

    await logAudit(req.user!.id, req.user!.full_name, 'SUBMIT_CLAIM', 'claim', claimId, `Submitted ownership claim #${claim_reference} for item #${foundItem.item_reference}`);

    // Create notification for claimant
    await db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, notification_type, link)
      VALUES (?, ?, ?, ?, 'claim_status', ?)
    `).run(
      'notif_' + crypto.randomBytes(8).toString('hex'),
      req.user!.id,
      'Claim Submitted Successfully',
      `Your ownership claim #${claim_reference} for "${foundItem.item_name}" has been received. University staff will review your evidence.`,
      '/dashboard/claims'
    );

    const createdClaim = await db.prepare(`
      SELECT c.*, f.item_name as found_name, f.item_reference as found_reference
      FROM claims c
      JOIN found_items f ON c.found_item_id = f.id
      WHERE c.id = ?
    `).get(claimId);

    return res.status(201).json({
      message: 'Claim submitted successfully',
      claim: createdClaim,
    });
  } catch (err: any) {
    console.error('Claim submission error:', err);
    return res.status(500).json({ error: 'Failed to submit claim' });
  }
});

// GET /api/claims/my-claims - Get logged-in user's claims
router.get('/my-claims', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const claims = await db.prepare(`
      SELECT c.*, 
             f.item_name as found_name, f.item_reference as found_reference, 
             f.color as found_color, f.image_url as found_image,
             f.current_storage_location, loc.name as location_name,
             cat.name as category_name,
             u.full_name as reviewed_by_name
      FROM claims c
      JOIN found_items f ON c.found_item_id = f.id
      LEFT JOIN locations loc ON f.location_id = loc.id
      LEFT JOIN categories cat ON f.category_id = cat.id
      LEFT JOIN users u ON c.reviewed_by = u.id
      WHERE c.claimant_id = ?
      ORDER BY c.created_at DESC
    `).all(req.user!.id);

    return res.json({ claims });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve your claims' });
  }
});

// GET /api/claims - Admin & Officer queue of claims
router.get('/', authenticateToken, requireRole('officer', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { status, query, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT c.*, 
             f.item_name as found_name, f.item_reference as found_reference, f.color as found_color,
             f.date_found, f.current_storage_location, f.image_url as found_image,
             cat.name as category_name, loc.name as location_name,
             u.full_name as claimant_name, u.student_staff_id as claimant_student_id, u.email as claimant_email, u.phone as claimant_phone,
             reviewer.full_name as reviewer_name
      FROM claims c
      JOIN found_items f ON c.found_item_id = f.id
      JOIN users u ON c.claimant_id = u.id
      LEFT JOIN categories cat ON f.category_id = cat.id
      LEFT JOIN locations loc ON f.location_id = loc.id
      LEFT JOIN users reviewer ON c.reviewed_by = reviewer.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      sql += ` AND c.status = ?`;
      params.push(status);
    }
    if (query) {
      sql += ` AND (c.claim_reference ILIKE ? OR f.item_name ILIKE ? OR u.full_name ILIKE ? OR u.student_staff_id ILIKE ?)`;
      const q = `%${query}%`;
      params.push(q, q, q, q);
    }

    sql += ` ORDER BY CASE c.status WHEN 'Pending' THEN 1 WHEN 'Under Review' THEN 2 WHEN 'Info Requested' THEN 3 ELSE 4 END, c.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const claims = await db.prepare(sql).all(...params);
    return res.json({ claims });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch claims list' });
  }
});

// GET /api/claims/:id - View claim details
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const claim = await db.prepare(`
      SELECT c.*, 
             f.item_name as found_name, f.item_reference as found_reference, f.description as found_desc,
             f.color as found_color, f.date_found, f.approximate_time as found_time,
             f.current_storage_location, f.is_handed_to_security, f.image_url as found_image,
             cat.name as category_name, loc.name as location_name,
             u.full_name as claimant_name, u.student_staff_id as claimant_student_id, u.email as claimant_email, u.phone as claimant_phone, u.department as claimant_department,
             reviewer.full_name as reviewer_name
      FROM claims c
      JOIN found_items f ON c.found_item_id = f.id
      JOIN users u ON c.claimant_id = u.id
      LEFT JOIN categories cat ON f.category_id = cat.id
      LEFT JOIN locations loc ON f.location_id = loc.id
      LEFT JOIN users reviewer ON c.reviewed_by = reviewer.id
      WHERE c.id = ?
    `).get(req.params.id) as any;

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    // Ensure student only views their own claim
    if (req.user!.role === 'student' && claim.claimant_id !== req.user!.id) {
      return res.status(403).json({ error: 'You are not authorized to view this claim' });
    }

    return res.json({ claim });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch claim details' });
  }
});

// PATCH /api/claims/:id/review - Review Claim
router.patch('/:id/review', authenticateToken, requireRole('officer', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { status, rejection_reason, admin_notes } = req.body;

    if (!['Approved', 'Rejected', 'Info Requested', 'Under Review'].includes(status)) {
      return res.status(400).json({ error: 'Invalid claim review status' });
    }

    if (status === 'Rejected' && !rejection_reason) {
      return res.status(400).json({ error: 'Please provide a reason for rejecting this claim' });
    }

    const claim = await db.prepare(`
      SELECT c.*, f.item_name as found_name, f.item_reference as found_reference
      FROM claims c
      JOIN found_items f ON c.found_item_id = f.id
      WHERE c.id = ?
    `).get(req.params.id) as any;

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    await db.prepare(`
      UPDATE claims 
      SET status = ?, rejection_reason = ?, admin_notes = ?, reviewed_by = ?, reviewed_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(
      status,
      rejection_reason || null,
      admin_notes || null,
      req.user!.id,
      claim.id
    );

    // If Approved:
    if (status === 'Approved') {
      await db.prepare('UPDATE found_items SET status = \'Claim Approved\', updated_at = datetime(\'now\') WHERE id = ?').run(claim.found_item_id);

      if (claim.lost_item_id) {
        await db.prepare('UPDATE lost_items SET status = \'Claim Approved\', updated_at = datetime(\'now\') WHERE id = ?').run(claim.lost_item_id);
      }

      await db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, notification_type, link)
        VALUES (?, ?, ?, ?, 'claim_status', ?)
      `).run(
        'notif_' + crypto.randomBytes(8).toString('hex'),
        claim.claimant_id,
        'Claim Approved — Ready for Collection',
        `Your claim #${claim.claim_reference} for "${claim.found_name}" has been approved! Please visit the designated university lost-and-found/security office with your student ID and collection reference #${claim.claim_reference}.`,
        '/dashboard/claims'
      );
    } else if (status === 'Rejected') {
      await db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, notification_type, link)
        VALUES (?, ?, ?, ?, 'claim_status', ?)
      `).run(
        'notif_' + crypto.randomBytes(8).toString('hex'),
        claim.claimant_id,
        'Claim Decision Notice',
        `Your claim #${claim.claim_reference} for "${claim.found_name}" was rejected. Reason: ${rejection_reason}`,
        '/dashboard/claims'
      );
    } else if (status === 'Info Requested') {
      await db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, notification_type, link)
        VALUES (?, ?, ?, ?, 'claim_status', ?)
      `).run(
        'notif_' + crypto.randomBytes(8).toString('hex'),
        claim.claimant_id,
        'Additional Information Required for Claim',
        `The administrator requested additional verification for claim #${claim.claim_reference}: ${admin_notes || 'Please visit the desk or update your notes.'}`,
        '/dashboard/claims'
      );
    }

    await logAudit(
      req.user!.id,
      req.user!.full_name,
      `CLAIM_${status.toUpperCase().replace(/\s+/g, '_')}`,
      'claim',
      claim.id,
      `Claim #${claim.claim_reference} set to ${status}. Notes: ${admin_notes || rejection_reason || 'N/A'}`
    );

    return res.json({ message: `Claim status updated to ${status}` });
  } catch (err: any) {
    console.error('Claim review error:', err);
    return res.status(500).json({ error: 'Failed to update claim' });
  }
});

export default router;
