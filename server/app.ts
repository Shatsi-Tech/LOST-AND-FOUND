import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase, db } from './db.js';
import { seedDatabase } from './seed.js';

import authRoutes from './routes/auth.js';
import itemRoutes from './routes/items.js';
import claimRoutes from './routes/claims.js';
import handoverRoutes from './routes/handovers.js';
import adminRoutes from './routes/admin.js';
import notificationRoutes from './routes/notifications.js';
import statsRoutes from './routes/stats.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Initialize database schema in background
initDatabase().then(async () => {
  try {
    const userCount = await db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    if (!userCount || Number(userCount.count) === 0) {
      console.log('Database empty, running initial seed on Supabase...');
      await seedDatabase();
    }
  } catch (err: any) {
    console.error('Initial database check error:', err.message);
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads folder (for local storage fallback)
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch {}
}
app.use('/uploads', express.static(uploadsDir));

// Route Handlers
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/handovers', handoverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);

// Public categories and locations endpoint
app.get('/api/meta', async (req, res) => {
  try {
    const categories = await db.query('SELECT id, name, description, icon FROM categories WHERE status = \'active\' ORDER BY name ASC');
    const locations = await db.query('SELECT id, name, description, zone FROM locations WHERE status = \'active\' ORDER BY name ASC');
    res.json({ categories, locations });
  } catch (err: any) {
    console.error('Meta fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
});

// Seed trigger route for testing/presentation reset
app.post('/api/seed/reset', async (req, res) => {
  try {
    await seedDatabase();
    res.json({ message: 'Database reset and re-seeded with demo data successfully!' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset database: ' + err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: 'Supabase PostgreSQL',
    timestamp: new Date().toISOString(),
    service: 'UniFind Campus Backend'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error handler caught:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

export default app;
