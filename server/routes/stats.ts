import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// GET /api/stats/public - Landing page public dynamic statistics
router.get('/public', async (req, res) => {
  try {
    const totalLostRow = await db.prepare('SELECT COUNT(*) as count FROM lost_items').get() as any;
    const totalFoundRow = await db.prepare('SELECT COUNT(*) as count FROM found_items').get() as any;
    const totalReturnedRow = await db.prepare('SELECT COUNT(*) as count FROM found_items WHERE status = \'Returned\'').get() as any;
    const activeUsersRow = await db.prepare('SELECT COUNT(*) as count FROM users WHERE account_status = \'active\'').get() as any;

    const lostCount = Number(totalLostRow?.count || 0);
    const foundCount = Number(totalFoundRow?.count || 0);
    const totalReports = lostCount + foundCount;
    const totalReturned = Number(totalReturnedRow?.count || 0);
    const recoveryRate = totalReports > 0 ? Math.round((totalReturned / (foundCount || 1)) * 100) : 85;

    // Recent 6 found items for landing page showcase
    const recentFoundItems = await db.prepare(`
      SELECT f.id, f.item_reference, f.item_name, f.color, f.date_found, f.image_url, f.status,
             c.name as category_name, loc.name as location_name
      FROM found_items f
      LEFT JOIN categories c ON f.category_id = c.id
      LEFT JOIN locations loc ON f.location_id = loc.id
      WHERE f.status IN ('Found', 'Under Verification')
      ORDER BY f.created_at DESC
      LIMIT 6
    `).all();

    return res.json({
      total_lost: lostCount,
      total_found: foundCount,
      total_returned: totalReturned,
      active_users: Number(activeUsersRow?.count || 0),
      recovery_rate: Math.min(100, recoveryRate),
      recent_found: recentFoundItems,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch public statistics' });
  }
});

// GET /api/stats/dashboard - Student / General summary
router.get('/student-summary/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const lostCount = await db.prepare('SELECT COUNT(*) as count FROM lost_items WHERE reporter_id = ?').get(userId) as any;
    const foundCount = await db.prepare('SELECT COUNT(*) as count FROM found_items WHERE reporter_id = ?').get(userId) as any;
    const claimsCount = await db.prepare('SELECT COUNT(*) as count FROM claims WHERE claimant_id = ? AND status IN (\'Pending\', \'Under Review\', \'Info Requested\')').get(userId) as any;
    const recoveredCount = await db.prepare(`
      SELECT COUNT(*) as count FROM lost_items WHERE reporter_id = ? AND status = 'Returned'
    `).get(userId) as any;

    const matchesCount = await db.prepare(`
      SELECT COUNT(*) as count FROM matches m
      JOIN lost_items l ON m.lost_item_id = l.id
      WHERE l.reporter_id = ? AND m.status = 'Suggested'
    `).get(userId) as any;

    // Recent activity for student
    const recentActivity = await db.prepare(`
      SELECT 'lost' as type, item_reference as ref, item_name as title, status, created_at, id
      FROM lost_items WHERE reporter_id = ?
      UNION ALL
      SELECT 'found' as type, item_reference as ref, item_name as title, status, created_at, id
      FROM found_items WHERE reporter_id = ?
      UNION ALL
      SELECT 'claim' as type, claim_reference as ref, 'Claim for Found Item' as title, status, created_at, id
      FROM claims WHERE claimant_id = ?
      ORDER BY created_at DESC
      LIMIT 8
    `).all(userId, userId, userId);

    return res.json({
      my_lost: Number(lostCount?.count || 0),
      my_found: Number(foundCount?.count || 0),
      pending_claims: Number(claimsCount?.count || 0),
      recovered: Number(recoveredCount?.count || 0),
      possible_matches: Number(matchesCount?.count || 0),
      recent_activity: recentActivity,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch student statistics' });
  }
});

// GET /api/stats/admin - Comprehensive Analytics for Admin Dashboard
router.get('/admin', async (req, res) => {
  try {
    const totalUsers = await db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    const totalLost = await db.prepare('SELECT COUNT(*) as count FROM lost_items').get() as any;
    const totalFound = await db.prepare('SELECT COUNT(*) as count FROM found_items').get() as any;
    const pendingClaims = await db.prepare('SELECT COUNT(*) as count FROM claims WHERE status IN (\'Pending\', \'Under Review\')').get() as any;
    const approvedClaims = await db.prepare('SELECT COUNT(*) as count FROM claims WHERE status = \'Approved\'').get() as any;
    const rejectedClaims = await db.prepare('SELECT COUNT(*) as count FROM claims WHERE status = \'Rejected\'').get() as any;
    const returnedItems = await db.prepare('SELECT COUNT(*) as count FROM found_items WHERE status = \'Returned\'').get() as any;
    const unclaimedItems = await db.prepare("SELECT COUNT(*) as count FROM found_items WHERE status = 'Unclaimed' OR (status = 'Found' AND created_at < NOW() - INTERVAL '30 days')").get() as any;

    // Items by category
    const categoryStats = await db.prepare(`
      SELECT * FROM (
        SELECT c.name,
          (SELECT COUNT(*) FROM lost_items WHERE category_id = c.id) as lost_count,
          (SELECT COUNT(*) FROM found_items WHERE category_id = c.id) as found_count
        FROM categories c
        WHERE c.status = 'active'
      ) sub
      ORDER BY (lost_count + found_count) DESC
      LIMIT 10
    `).all();

    // Hotspot campus locations
    const locationStats = await db.prepare(`
      SELECT * FROM (
        SELECT loc.name,
          (SELECT COUNT(*) FROM lost_items WHERE location_id = loc.id) as lost_count,
          (SELECT COUNT(*) FROM found_items WHERE location_id = loc.id) as found_count
        FROM locations loc
        WHERE loc.status = 'active'
      ) sub
      ORDER BY (lost_count + found_count) DESC
      LIMIT 8
    `).all();

    // Recent pending claims
    const pendingClaimsList = await db.prepare(`
      SELECT c.*, f.item_name as found_name, f.item_reference as found_reference,
             u.full_name as claimant_name, u.student_staff_id as claimant_student_id
      FROM claims c
      JOIN found_items f ON c.found_item_id = f.id
      JOIN users u ON c.claimant_id = u.id
      WHERE c.status IN ('Pending', 'Under Review')
      ORDER BY c.created_at DESC
      LIMIT 5
    `).all();

    // Recent handovers
    const recentHandovers = await db.prepare(`
      SELECT h.*, f.item_name, f.item_reference, u.full_name as recipient_name, officer.full_name as officer_name
      FROM handovers h
      JOIN found_items f ON h.found_item_id = f.id
      JOIN users u ON h.recipient_id = u.id
      JOIN users officer ON h.officer_id = officer.id
      ORDER BY h.created_at DESC
      LIMIT 5
    `).all();

    // System audit feed
    const recentAudit = await db.prepare(`
      SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 6
    `).all();

    return res.json({
      kpis: {
        total_users: Number(totalUsers?.count || 0),
        total_lost: Number(totalLost?.count || 0),
        total_found: Number(totalFound?.count || 0),
        pending_claims: Number(pendingClaims?.count || 0),
        approved_claims: Number(approvedClaims?.count || 0),
        rejected_claims: Number(rejectedClaims?.count || 0),
        returned_items: Number(returnedItems?.count || 0),
        unclaimed_items: Number(unclaimedItems?.count || 0),
      },
      category_stats: categoryStats,
      location_stats: locationStats,
      pending_claims: pendingClaimsList,
      recent_handovers: recentHandovers,
      recent_audit: recentAudit,
    });
  } catch (err: any) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ error: 'Failed to fetch administrative analytics' });
  }
});

export default router;
