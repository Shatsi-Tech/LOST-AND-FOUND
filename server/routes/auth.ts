import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db.js';
import { AuthRequest, authenticateToken, logAudit } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_campus_lost_and_found_jwt_key_2026';

function generateToken(user: any) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, student_staff_id: user.student_staff_id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { full_name, student_staff_id, email, phone, password, confirm_password, department, role: requestedRole } = req.body;

    if (!full_name || !student_staff_id || !email || !password) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid university email address' });
    }

    // Check existing email or student_staff_id
    const existingUser = await db.prepare('SELECT id FROM users WHERE email = ? OR student_staff_id = ?').get(email.toLowerCase(), student_staff_id.trim()) as any;
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email or Student/Staff ID already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const userId = 'usr_' + crypto.randomBytes(8).toString('hex');
    const role = (requestedRole && ['admin', 'officer', 'student'].includes(requestedRole)) ? requestedRole : 'student';

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
      department || (role === 'admin' ? 'System Administration' : 'General Campus')
    );

    const newUser = await db.prepare('SELECT id, full_name, student_staff_id, email, phone, role, account_status, department, created_at FROM users WHERE id = ?').get(userId) as any;
    const token = generateToken(newUser);

    await logAudit(userId, full_name, 'REGISTER', 'user', userId, `Student account registered: ${email}`);

    // Create welcome notification
    await db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, notification_type, link)
      VALUES (?, ?, 'Welcome to UniFind', 'Your campus lost and found portal account is active. You can now report lost or found items and submit claims.', 'system', '/dashboard')
    `).run('notif_' + crypto.randomBytes(8).toString('hex'), userId);

    return res.status(201).json({
      message: 'Account created successfully',
      user: newUser,
      token,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Registration failed. ' + (err.message || 'Internal server error') });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // Can be email, student_staff_id, or phone

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Please enter your email/ID and password' });
    }

    const trimmed = identifier.trim();
    const user = await db.prepare(`
      SELECT * FROM users 
      WHERE lower(email) = lower(?) 
         OR upper(student_staff_id) = upper(?)
         OR phone = ?
         OR lower(email) LIKE ?
    `).get(trimmed, trimmed, trimmed, `${trimmed.toLowerCase()}@%`) as any;

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    if (user.account_status !== 'active') {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact campus security or admin.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    await logAudit(user.id, user.full_name, 'LOGIN', 'user', user.id, `User logged in: ${user.email}`);

    return res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  const user = await db.prepare('SELECT id, full_name, student_staff_id, email, phone, role, account_status, department, avatar_url, created_at FROM users WHERE id = ?').get(req.user!.id) as any;
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({ user });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, new_password, confirm_password } = req.body;
    if (!email || !new_password) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }
    if (new_password !== confirm_password) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const user = await db.prepare('SELECT id, full_name FROM users WHERE lower(email) = lower(?)').get(email.trim()) as any;
    if (!user) {
      return res.status(404).json({ error: 'No account registered with this email address' });
    }

    const hashedPassword = bcrypt.hashSync(new_password, 10);
    await db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, user.id);

    await logAudit(user.id, user.full_name, 'PASSWORD_RESET', 'user', user.id, `Password reset for user ${email}`);

    return res.json({ message: 'Password reset successfully. You may now log in with your new password.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Password reset failed' });
  }
});

// POST /api/auth/demo-switch (Switch active user instantly for presentation/evaluation)
router.post('/demo-switch', async (req, res) => {
  try {
    const { role, email } = req.body;
    let user: any;

    if (email) {
      user = await db.prepare('SELECT * FROM users WHERE lower(email) = lower(?)').get(email.trim());
    } else if (role) {
      user = await db.prepare('SELECT * FROM users WHERE role = ? AND account_status = \'active\' LIMIT 1').get(role);
    }

    if (!user) {
      return res.status(404).json({ error: 'Demo user not found for requested role' });
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      message: `Switched session to ${user.full_name} (${user.role})`,
      user: userWithoutPassword,
      token,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to switch demo user' });
  }
});

// GET /api/auth/demo-users (List quick preset accounts for easy demo switching)
router.get('/demo-users', async (req, res) => {
  const demoUsers = await db.prepare(`
    SELECT id, full_name, student_staff_id, email, role, department 
    FROM users 
    WHERE account_status = 'active'
    ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'officer' THEN 2 ELSE 3 END, full_name ASC
    LIMIT 6
  `).all();
  return res.json({ users: demoUsers });
});

export default router;
