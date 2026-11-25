import { Router, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { AuthRequest, authenticateToken, requireRole, logAudit } from '../middleware/auth.js';

const router = Router();

// Require admin role for all routes in this file
router.use(authenticateToken, requireRole('admin'));

// ----------------------------------------------------
// CATEGORY MANAGEMENT
// ----------------------------------------------------
// GET /api/admin/categories
router.get('/categories', async (req, res) => {
  const categories = await db.prepare(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM lost_items WHERE category_id = c.id) as lost_count,
      (SELECT COUNT(*) FROM found_items WHERE category_id = c.id) as found_count
    FROM categories c 
    ORDER BY c.name ASC
  `).all();
  return res.json({ categories });
});

// POST /api/admin/categories
router.post('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, icon } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });

    const existing = await db.prepare('SELECT id FROM categories WHERE lower(name) = lower(?)').get(name.trim());
    if (existing) return res.status(409).json({ error: 'Category already exists' });

    const id = 'cat_' + crypto.randomBytes(6).toString('hex');
    await db.prepare(`
      INSERT INTO categories (id, name, description, icon, status, created_at)
      VALUES (?, ?, ?, ?, 'active', datetime('now'))
    `).run(id, name.trim(), description ? description.trim() : null, icon || 'Package');

    await logAudit(req.user!.id, req.user!.full_name, 'CREATE_CATEGORY', 'category', id, `Created category "${name}"`);

    return res.status(201).json({ message: 'Category created successfully', id });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/admin/categories/:id
router.put('/categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, icon, status } = req.body;
    const cat = await db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id) as any;
    if (!cat) return res.status(404).json({ error: 'Category not found' });

    await db.prepare(`
      UPDATE categories 
      SET name = ?, description = ?, icon = ?, status = ?
      WHERE id = ?
    `).run(name ? name.trim() : cat.name, description !== undefined ? description : cat.description, icon || cat.icon, status || cat.status, cat.id);

    await logAudit(req.user!.id, req.user!.full_name, 'UPDATE_CATEGORY', 'category', cat.id, `Updated category "${name || cat.name}"`);

    return res.json({ message: 'Category updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update category' });
  }
});

// ----------------------------------------------------
// LOCATION MANAGEMENT
// ----------------------------------------------------
// GET /api/admin/locations
router.get('/locations', async (req, res) => {
  const locations = await db.prepare(`
    SELECT loc.*,
      (SELECT COUNT(*) FROM lost_items WHERE location_id = loc.id) as lost_count,
      (SELECT COUNT(*) FROM found_items WHERE location_id = loc.id) as found_count
    FROM locations loc
    ORDER BY loc.name ASC
  `).all();
  return res.json({ locations });
});

// POST /api/admin/locations
router.post('/locations', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, zone } = req.body;
    if (!name) return res.status(400).json({ error: 'Location name is required' });

    const existing = await db.prepare('SELECT id FROM locations WHERE lower(name) = lower(?)').get(name.trim());
    if (existing) return res.status(409).json({ error: 'Location already exists' });

    const id = 'loc_' + crypto.randomBytes(6).toString('hex');
    await db.prepare(`
      INSERT INTO locations (id, name, description, zone, status, created_at)
      VALUES (?, ?, ?, ?, 'active', datetime('now'))
    `).run(id, name.trim(), description ? description.trim() : null, zone || 'Main Campus');

    await logAudit(req.user!.id, req.user!.full_name, 'CREATE_LOCATION', 'location', id, `Created campus location "${name}"`);

    return res.status(201).json({ message: 'Location created successfully', id });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create location' });
  }
});

// PUT /api/admin/locations/:id
router.put('/locations/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, zone, status } = req.body;
    const loc = await db.prepare('SELECT * FROM locations WHERE id = ?').get(req.params.id) as any;
    if (!loc) return res.status(404).json({ error: 'Location not found' });

    await db.prepare(`
      UPDATE locations 
      SET name = ?, description = ?, zone = ?, status = ?
      WHERE id = ?
    `).run(name ? name.trim() : loc.name, description !== undefined ? description : loc.description, zone || loc.zone, status || loc.status, loc.id);

    await logAudit(req.user!.id, req.user!.full_name, 'UPDATE_LOCATION', 'location', loc.id, `Updated campus location "${name || loc.name}"`);

    return res.json({ message: 'Location updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update location' });
  }
});

// ----------------------------------------------------
// USER MANAGEMENT
// ----------------------------------------------------
// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { query, role, status, limit = 50, offset = 0 } = req.query;
    let sql = `
      SELECT id, full_name, student_staff_id, email, phone, role, account_status, department, created_at,
        (SELECT COUNT(*) FROM lost_items WHERE reporter_id = users.id) as lost_reports_count,
        (SELECT COUNT(*) FROM found_items WHERE reporter_id = users.id) as found_reports_count,
        (SELECT COUNT(*) FROM claims WHERE claimant_id = users.id) as claims_count
      FROM users
      WHERE 1=1
    `;
    const params: any[] = [];

    if (query) {
      sql += ` AND (full_name ILIKE ? OR student_staff_id ILIKE ? OR email ILIKE ?)`;
      const q = `%${query}%`;
      params.push(q, q, q);
    }
    if (role && role !== 'all') {
      sql += ` AND role = ?`;
      params.push(role);
    }
    if (status && status !== 'all') {
      sql += ` AND account_status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const users = await db.prepare(sql).all(...params);
    return res.json({ users });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to list users' });
  }
});

// POST /api/admin/users (Create a new user by Admin)
router.post('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { full_name, student_staff_id, email, phone, password, role, department } = req.body;

    if (!full_name || !student_staff_id || !email || !password || !role) {
      return res.status(400).json({ error: 'Please provide all required fields (Full Name, Student/Staff ID, Email, Role, Password)' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const validRoles = ['student', 'officer', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be student, officer, or admin' });
    }

    // Check existing email or student_staff_id
    const existing = await db.prepare('SELECT id FROM users WHERE lower(email) = lower(?) OR upper(student_staff_id) = upper(?)').get(email.trim(), student_staff_id.trim()) as any;
    if (existing) {
      return res.status(409).json({ error: 'A user with this email or Student/Staff ID already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const userId = 'usr_' + crypto.randomBytes(8).toString('hex');

    await db.prepare(`
      INSERT INTO users (id, full_name, student_staff_id, email, phone, password, role, account_status, department)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `).run(
      userId,
      full_name.trim(),
      student_staff_id.trim().toUpperCase(),
      email.toLowerCase().trim(),
      phone ? phone.trim() : null,
      hashedPassword,
      role,
      department ? department.trim() : 'Campus Member'
    );

    const newUser = await db.prepare('SELECT id, full_name, student_staff_id, email, phone, role, account_status, department, created_at FROM users WHERE id = ?').get(userId) as any;

    await logAudit(
      req.user!.id,
      req.user!.full_name,
      'CREATE_USER',
      'user',
      userId,
      `Admin created ${role} account: ${email} (${full_name})`
    );

    // Create welcome notification for user
    await db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, notification_type, link)
      VALUES (?, ?, 'Account Created', 'Your campus lost and found portal account has been created by the system administrator.', 'system', '/dashboard')
    `).run('notif_' + crypto.randomBytes(8).toString('hex'), userId);

    return res.status(201).json({
      message: 'User created successfully',
      user: newUser,
    });
  } catch (err: any) {
    console.error('Admin create user error:', err);
    return res.status(500).json({ error: 'Failed to create user: ' + (err.message || 'Internal server error') });
  }
});

// PATCH /api/admin/users/:id/status
router.patch('/users/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { account_status, role } = req.body;
    const user = await db.prepare('SELECT id, full_name, email, role, account_status FROM users WHERE id = ?').get(req.params.id) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });

    let sql = 'UPDATE users SET';
    const updates: string[] = [];
    const params: any[] = [];

    if (account_status) {
      updates.push(' account_status = ?');
      params.push(account_status);
    }
    if (role) {
      updates.push(' role = ?');
      params.push(role);
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    sql += updates.join(',') + ' WHERE id = ?';
    params.push(user.id);

    await db.prepare(sql).run(...params);

    await logAudit(req.user!.id, req.user!.full_name, 'UPDATE_USER', 'user', user.id, `Updated user ${user.email} (Status: ${account_status || user.account_status}, Role: ${role || user.role})`);

    return res.json({ message: 'User updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/admin/users/:id (Delete a user account)
router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userToDelete = await db.prepare('SELECT id, full_name, email, role FROM users WHERE id = ?').get(req.params.id) as any;
    if (!userToDelete) return res.status(404).json({ error: 'User not found' });

    // Prevent deleting self
    if (userToDelete.id === req.user!.id) {
      return res.status(400).json({ error: 'You cannot delete your own administrator account while logged in.' });
    }

    // Delete user
    await db.prepare('DELETE FROM users WHERE id = ?').run(userToDelete.id);

    await logAudit(
      req.user!.id,
      req.user!.full_name,
      'DELETE_USER',
      'user',
      userToDelete.id,
      `Admin deleted ${userToDelete.role} account: ${userToDelete.email} (${userToDelete.full_name})`
    );

    return res.json({ message: `User "${userToDelete.full_name}" deleted successfully` });
  } catch (err: any) {
    console.error('Admin delete user error:', err);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

// POST /api/admin/users/:id/reset-password
router.post('/users/:id/reset-password', async (req: AuthRequest, res: Response) => {
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await db.prepare('SELECT id, full_name, email FROM users WHERE id = ?').get(req.params.id) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });

    const hashedPassword = bcrypt.hashSync(new_password, 10);
    await db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, user.id);

    await logAudit(req.user!.id, req.user!.full_name, 'ADMIN_PASSWORD_RESET', 'user', user.id, `Reset password for user ${user.email}`);

    return res.json({ message: `Password reset successfully for ${user.full_name}` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ----------------------------------------------------
// AUDIT LOGS
// ----------------------------------------------------
// GET /api/admin/audit-logs
router.get('/audit-logs', async (req, res) => {
  try {
    const { query, entity_type, action, limit = 100, offset = 0 } = req.query;
    let sql = `SELECT * FROM audit_logs WHERE 1=1`;
    const params: any[] = [];

    if (query) {
      sql += ` AND (description ILIKE ? OR user_name ILIKE ? OR entity_id ILIKE ?)`;
      const q = `%${query}%`;
      params.push(q, q, q);
    }
    if (entity_type && entity_type !== 'all') {
      sql += ` AND entity_type = ?`;
      params.push(entity_type);
    }
    if (action && action !== 'all') {
      sql += ` AND action ILIKE ?`;
      params.push(`%${action}%`);
    }

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const logs = await db.prepare(sql).all(...params);
    return res.json({ logs });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve audit logs' });
  }
});

// ----------------------------------------------------
// REPORT EXPORT
// ----------------------------------------------------
// GET /api/admin/export/:type
router.get('/export/:type', async (req, res) => {
  try {
    const { type } = req.params; // 'lost', 'found', 'claims', 'handovers'
    let data: any[] = [];

    if (type === 'lost') {
      data = await db.prepare(`
        SELECT l.item_reference, l.item_name, c.name as category, loc.name as location, l.color,
               l.date_lost, l.approximate_time, l.status, u.full_name as reporter, u.student_staff_id, l.created_at
        FROM lost_items l
        LEFT JOIN categories c ON l.category_id = c.id
        LEFT JOIN locations loc ON l.location_id = loc.id
        LEFT JOIN users u ON l.reporter_id = u.id
        ORDER BY l.created_at DESC
      `).all();
    } else if (type === 'found') {
      data = await db.prepare(`
        SELECT f.item_reference, f.item_name, c.name as category, loc.name as location, f.color,
               f.date_found, f.current_storage_location, f.status, u.full_name as reporter, f.created_at
        FROM found_items f
        LEFT JOIN categories c ON f.category_id = c.id
        LEFT JOIN locations loc ON f.location_id = loc.id
        LEFT JOIN users u ON f.reporter_id = u.id
        ORDER BY f.created_at DESC
      `).all();
    } else if (type === 'claims') {
      data = await db.prepare(`
        SELECT c.claim_reference, f.item_reference as found_ref, f.item_name as item_name,
               u.full_name as claimant, u.student_staff_id as student_id, c.status,
               c.rejection_reason, reviewer.full_name as reviewed_by, c.created_at, c.reviewed_at
        FROM claims c
        JOIN found_items f ON c.found_item_id = f.id
        JOIN users u ON c.claimant_id = u.id
        LEFT JOIN users reviewer ON c.reviewed_by = reviewer.id
        ORDER BY c.created_at DESC
      `).all();
    } else if (type === 'handovers') {
      data = await db.prepare(`
        SELECT h.handover_reference, c.claim_reference, f.item_name,
               u.full_name as recipient, u.student_staff_id as recipient_id,
               officer.full_name as officer_name, h.handover_date, h.handover_time, h.notes, h.created_at
        FROM handovers h
        JOIN claims c ON h.claim_id = c.id
        JOIN found_items f ON h.found_item_id = f.id
        JOIN users u ON h.recipient_id = u.id
        JOIN users officer ON h.officer_id = officer.id
        ORDER BY h.created_at DESC
      `).all();
    } else {
      return res.status(400).json({ error: 'Invalid export type' });
    }

    return res.json({ type, count: data.length, data });
  } catch (err: any) {
    return res.status(500).json({ error: 'Export failed' });
  }
});

export default router;
