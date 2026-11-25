import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_campus_lost_and_found_jwt_key_2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'student' | 'officer' | 'admin';
    full_name: string;
    student_staff_id: string;
  };
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    // Verify user exists and is active
    const user = await db.prepare('SELECT id, email, role, full_name, student_staff_id, account_status FROM users WHERE id = ?').get(decoded.id) as any;

    if (!user || user.account_status !== 'active') {
      return res.status(403).json({ error: 'User account is inactive or not found' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      student_staff_id: user.student_staff_id,
    };

    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired session token' });
  }
}

export function requireRole(...roles: Array<'student' | 'officer' | 'admin'>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You are not authorized to perform this action' });
    }

    next();
  };
}

export async function logAudit(userId: string | null, userName: string | null, action: string, entityType: string, entityId: string | null, description: string, ipAddress: string = '') {
  try {
    const logId = 'audit_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    await db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, action, entity_type, entity_id, description, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(logId, userId, userName || 'System', action, entityType, entityId, description, ipAddress);
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
