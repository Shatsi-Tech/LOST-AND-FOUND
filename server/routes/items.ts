import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { AuthRequest, authenticateToken, requireRole, logAudit } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { runMatchingForLostItem, runMatchingForFoundItem } from '../matchingEngine.js';

const router = Router();

// Helper to generate reference numbers
async function generateReference(type: 'LOST' | 'FOUND'): Promise<string> {
  const year = new Date().getFullYear();
  const countRow = await db.prepare(`
    SELECT COUNT(*) as count FROM ${type === 'LOST' ? 'lost_items' : 'found_items'}
  `).get() as any;
  const count = Number(countRow?.count || 0);
  const seq = (count + 1).toString().padStart(4, '0');
  const rand = Math.floor(100 + Math.random() * 900);
  return `${type}-${year}-${seq}${rand ? '-' + rand : ''}`;
}

// POST /api/items/upload-image
router.post('/upload-image', authenticateToken, upload.single('image'), (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  return res.json({ url: fileUrl });
});

// POST /api/items/lost - Report Lost Item
router.post('/lost', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      item_name,
      category_id,
      description,
      color,
      date_lost,
      approximate_time,
      location_id,
      additional_info,
      contact_phone,
      image_url,
    } = req.body;

    if (!item_name || !category_id || !description || !color || !date_lost || !location_id) {
      return res.status(400).json({ error: 'Please fill in all mandatory fields' });
    }

    const id = 'lost_' + crypto.randomBytes(8).toString('hex');
    const item_reference = await generateReference('LOST');

    await db.prepare(`
      INSERT INTO lost_items (
        id, item_reference, reporter_id, category_id, item_name, description,
        color, date_lost, approximate_time, location_id, additional_info,
        contact_phone, image_url, status, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, 'Lost', datetime('now'), datetime('now')
      )
    `).run(
      id,
      item_reference,
      req.user!.id,
      category_id,
      item_name.trim(),
      description.trim(),
      color.trim(),
      date_lost,
      approximate_time || null,
      location_id,
      additional_info ? additional_info.trim() : null,
      contact_phone ? contact_phone.trim() : null,
      image_url || null
    );

    await logAudit(req.user!.id, req.user!.full_name, 'REPORT_LOST', 'lost_item', id, `Reported lost item #${item_reference}: ${item_name}`);

    // Create confirmation notification
    await db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, notification_type, link)
      VALUES (?, ?, ?, ?, 'report_status', ?)
    `).run(
      'notif_' + crypto.randomBytes(8).toString('hex'),
      req.user!.id,
      'Lost Item Report Registered',
      `Your report for "${item_name}" has been registered with reference #${item_reference}. The campus matching engine is scanning existing found items.`,
      `/items/lost/${id}`
    );

    // Trigger matching algorithm in background
    try {
      await runMatchingForLostItem(id);
    } catch (matchErr) {
      console.error('Matching error for lost item:', matchErr);
    }

    const createdItem = await db.prepare(`
      SELECT l.*, c.name as category_name, loc.name as location_name
      FROM lost_items l
      LEFT JOIN categories c ON l.category_id = c.id
      LEFT JOIN locations loc ON l.location_id = loc.id
      WHERE l.id = ?
    `).get(id);

    return res.status(201).json({
      message: 'Lost item report submitted successfully',
      item: createdItem,
    });
  } catch (err: any) {
    console.error('Create lost item error:', err);
    return res.status(500).json({ error: 'Failed to submit lost item report' });
  }
});

// POST /api/items/found - Report Found Item
router.post('/found', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      item_name,
      category_id,
      description,
      color,
      date_found,
      approximate_time,
      location_id,
      current_storage_location,
      is_handed_to_security,
      additional_notes,
      is_valuable,
      image_url,
    } = req.body;

    if (!item_name || !category_id || !description || !color || !date_found || !location_id || !current_storage_location) {
      return res.status(400).json({ error: 'Please fill in all mandatory fields' });
    }

    const id = 'found_' + crypto.randomBytes(8).toString('hex');
    const item_reference = await generateReference('FOUND');

    await db.prepare(`
      INSERT INTO found_items (
        id, item_reference, reporter_id, category_id, item_name, description,
        color, date_found, approximate_time, location_id, current_storage_location,
        is_handed_to_security, additional_notes, is_valuable, image_url, status, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, 'Found', datetime('now'), datetime('now')
      )
    `).run(
      id,
      item_reference,
      req.user!.id,
      category_id,
      item_name.trim(),
      description.trim(),
      color.trim(),
      date_found,
      approximate_time || null,
      location_id,
      current_storage_location.trim(),
      is_handed_to_security ? 1 : 0,
      additional_notes ? additional_notes.trim() : null,
      is_valuable ? 1 : 0,
      image_url || null
    );

    await logAudit(req.user!.id, req.user!.full_name, 'REPORT_FOUND', 'found_item', id, `Reported found item #${item_reference}: ${item_name}`);

    // Create confirmation notification
    await db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, notification_type, link)
      VALUES (?, ?, ?, ?, 'report_status', ?)
    `).run(
      'notif_' + crypto.randomBytes(8).toString('hex'),
      req.user!.id,
      'Found Item Report Submitted',
      `Thank you for reporting "${item_name}" (#${item_reference}). Campus members will be able to search and claim it.`,
      `/items/found/${id}`
    );

    // Trigger matching algorithm
    try {
      await runMatchingForFoundItem(id);
    } catch (matchErr) {
      console.error('Matching error for found item:', matchErr);
    }

    const createdItem = await db.prepare(`
      SELECT f.*, c.name as category_name, loc.name as location_name
      FROM found_items f
      LEFT JOIN categories c ON f.category_id = c.id
      LEFT JOIN locations loc ON f.location_id = loc.id
      WHERE f.id = ?
    `).get(id);

    return res.status(201).json({
      message: 'Found item report submitted successfully',
      item: createdItem,
    });
  } catch (err: any) {
    console.error('Create found item error:', err);
    return res.status(500).json({ error: 'Failed to submit found item report' });
  }
});

// GET /api/items/lost - Search & list lost items
router.get('/lost', async (req, res) => {
  try {
    const { query, category_id, location_id, color, status, start_date, end_date, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT l.*, c.name as category_name, loc.name as location_name, u.full_name as reporter_name
      FROM lost_items l
      LEFT JOIN categories c ON l.category_id = c.id
      LEFT JOIN locations loc ON l.location_id = loc.id
      LEFT JOIN users u ON l.reporter_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (query) {
      sql += ` AND (l.item_name ILIKE ? OR l.description ILIKE ? OR l.item_reference ILIKE ?)`;
      const q = `%${query}%`;
      params.push(q, q, q);
    }
    if (category_id && category_id !== 'all') {
      sql += ` AND l.category_id = ?`;
      params.push(category_id);
    }
    if (location_id && location_id !== 'all') {
      sql += ` AND l.location_id = ?`;
      params.push(location_id);
    }
    if (color && color !== 'all') {
      sql += ` AND lower(l.color) LIKE lower(?)`;
      params.push(`%${color}%`);
    }
    if (status && status !== 'all') {
      sql += ` AND l.status = ?`;
      params.push(status);
    }
    if (start_date) {
      sql += ` AND l.date_lost >= ?`;
      params.push(start_date);
    }
    if (end_date) {
      sql += ` AND l.date_lost <= ?`;
      params.push(end_date);
    }

    sql += ` ORDER BY l.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const items = await db.prepare(sql).all(...params);
    return res.json({ items });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to search lost items' });
  }
});

// GET /api/items/found - Search & list found items (With Privacy Protection)
router.get('/found', async (req, res) => {
  try {
    const { query, category_id, location_id, color, status, start_date, end_date, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT f.*, c.name as category_name, loc.name as location_name, u.full_name as reporter_name
      FROM found_items f
      LEFT JOIN categories c ON f.category_id = c.id
      LEFT JOIN locations loc ON f.location_id = loc.id
      LEFT JOIN users u ON f.reporter_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (query) {
      sql += ` AND (f.item_name ILIKE ? OR f.description ILIKE ? OR f.item_reference ILIKE ?)`;
      const q = `%${query}%`;
      params.push(q, q, q);
    }
    if (category_id && category_id !== 'all') {
      sql += ` AND f.category_id = ?`;
      params.push(category_id);
    }
    if (location_id && location_id !== 'all') {
      sql += ` AND f.location_id = ?`;
      params.push(location_id);
    }
    if (color && color !== 'all') {
      sql += ` AND lower(f.color) LIKE lower(?)`;
      params.push(`%${color}%`);
    }
    if (status && status !== 'all') {
      sql += ` AND f.status = ?`;
      params.push(status);
    }
    if (start_date) {
      sql += ` AND f.date_found >= ?`;
      params.push(start_date);
    }
    if (end_date) {
      sql += ` AND f.date_found <= ?`;
      params.push(end_date);
    }

    sql += ` ORDER BY f.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rawItems = await db.prepare(sql).all(...params) as any[];

    // Privacy Masking for public list: remove sensitive notes for valuable items
    const items = rawItems.map(item => {
      if (item.is_valuable) {
        return {
          ...item,
          additional_notes: item.additional_notes ? '[Restricted - Ownership Verification Required]' : null,
        };
      }
      return item;
    });

    return res.json({ items });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to search found items' });
  }
});

// GET /api/items/lost/:id - Details of lost item
router.get('/lost/:id', async (req, res) => {
  try {
    const item = await db.prepare(`
      SELECT l.*, c.name as category_name, loc.name as location_name, u.full_name as reporter_name, u.email as reporter_email, u.student_staff_id as reporter_student_id
      FROM lost_items l
      LEFT JOIN categories c ON l.category_id = c.id
      LEFT JOIN locations loc ON l.location_id = loc.id
      LEFT JOIN users u ON l.reporter_id = u.id
      WHERE l.id = ?
    `).get(req.params.id) as any;

    if (!item) {
      return res.status(404).json({ error: 'Lost item not found' });
    }

    // Get possible matches for this lost item
    const matches = await db.prepare(`
      SELECT m.*, f.item_reference as found_reference, f.item_name as found_name, f.color as found_color,
             f.date_found, f.image_url as found_image, f.current_storage_location,
             loc.name as found_location_name, cat.name as found_category_name
      FROM matches m
      JOIN found_items f ON m.found_item_id = f.id
      LEFT JOIN locations loc ON f.location_id = loc.id
      LEFT JOIN categories cat ON f.category_id = cat.id
      WHERE m.lost_item_id = ?
      ORDER BY m.match_score DESC
    `).all(req.params.id);

    return res.json({ item, matches });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch lost item details' });
  }
});

// GET /api/items/found/:id - Details of found item
router.get('/found/:id', async (req: AuthRequest, res: Response) => {
  try {
    const item = await db.prepare(`
      SELECT f.*, c.name as category_name, loc.name as location_name, u.full_name as reporter_name, u.email as reporter_email
      FROM found_items f
      LEFT JOIN categories c ON f.category_id = c.id
      LEFT JOIN locations loc ON f.location_id = loc.id
      LEFT JOIN users u ON f.reporter_id = u.id
      WHERE f.id = ?
    `).get(req.params.id) as any;

    if (!item) {
      return res.status(404).json({ error: 'Found item not found' });
    }

    return res.json({ item });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch found item details' });
  }
});

// GET /api/items/my-lost
router.get('/my-lost', authenticateToken, async (req: AuthRequest, res: Response) => {
  const items = await db.prepare(`
    SELECT l.*, c.name as category_name, loc.name as location_name,
      (SELECT COUNT(*) FROM matches m WHERE m.lost_item_id = l.id) as match_count
    FROM lost_items l
    LEFT JOIN categories c ON l.category_id = c.id
    LEFT JOIN locations loc ON l.location_id = loc.id
    WHERE l.reporter_id = ?
    ORDER BY l.created_at DESC
  `).all(req.user!.id);
  return res.json({ items });
});

// GET /api/items/my-found
router.get('/my-found', authenticateToken, async (req: AuthRequest, res: Response) => {
  const items = await db.prepare(`
    SELECT f.*, c.name as category_name, loc.name as location_name,
      (SELECT COUNT(*) FROM claims cl WHERE cl.found_item_id = f.id) as claim_count
    FROM found_items f
    LEFT JOIN categories c ON f.category_id = c.id
    LEFT JOIN locations loc ON f.location_id = loc.id
    WHERE f.reporter_id = ?
    ORDER BY f.created_at DESC
  `).all(req.user!.id);
  return res.json({ items });
});

// PATCH /api/items/lost/:id/status - Update lost item status
router.patch('/lost/:id/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const item = await db.prepare('SELECT * FROM lost_items WHERE id = ?').get(req.params.id) as any;

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check ownership or staff privileges
    if (item.reporter_id !== req.user!.id && req.user!.role === 'student') {
      return res.status(403).json({ error: 'You are not authorized to edit this report' });
    }

    await db.prepare('UPDATE lost_items SET status = ?, updated_at = datetime("now") WHERE id = ?').run(status, item.id);

    await logAudit(req.user!.id, req.user!.full_name, 'UPDATE_LOST_STATUS', 'lost_item', item.id, `Status updated to ${status} for #${item.item_reference}`);

    return res.json({ message: 'Status updated successfully', status });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update item status' });
  }
});

// PATCH /api/items/found/:id/status
router.patch('/found/:id/status', authenticateToken, requireRole('officer', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { status, current_storage_location } = req.body;
    const item = await db.prepare('SELECT * FROM found_items WHERE id = ?').get(req.params.id) as any;

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    let sql = 'UPDATE found_items SET status = ?, updated_at = datetime("now")';
    const params: any[] = [status];

    if (current_storage_location) {
      sql += ', current_storage_location = ?';
      params.push(current_storage_location);
    }
    sql += ' WHERE id = ?';
    params.push(item.id);

    await db.prepare(sql).run(...params);

    await logAudit(req.user!.id, req.user!.full_name, 'UPDATE_FOUND_STATUS', 'found_item', item.id, `Status updated to ${status} for #${item.item_reference}`);

    return res.json({ message: 'Found item status updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update found item status' });
  }
});

export default router;
