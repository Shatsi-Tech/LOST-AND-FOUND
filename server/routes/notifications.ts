import { Router, Response } from 'express';
import { db } from '../db.js';
import { AuthRequest, authenticateToken } from '../middleware/auth.js';

const router = Router();

// GET /api/notifications - List user's notifications
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(req.user!.id);

    const unreadCountRow = await db.prepare(`
      SELECT COUNT(*) as unread_count FROM notifications
      WHERE user_id = ? AND is_read = 0
    `).get(req.user!.id) as any;

    return res.json({
      notifications,
      unread_count: unreadCountRow ? Number(unreadCountRow.unread_count) : 0,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const row = await db.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ? AND is_read = 0
    `).get(req.user!.id) as any;

    return res.json({ count: row ? Number(row.count) : 0 });
  } catch (err: any) {
    return res.status(500).json({ count: 0 });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
    return res.json({ message: 'Notification marked as read' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update notification' });
  }
});

// PATCH /api/notifications/mark-all-read
router.patch('/mark-all-read', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user!.id);
    return res.json({ message: 'All notifications marked as read' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
    return res.json({ message: 'Notification removed' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router;
