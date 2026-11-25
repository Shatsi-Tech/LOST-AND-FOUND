import { db } from './db.js';
import crypto from 'crypto';

interface MatchResult {
  score: number;
  breakdown: {
    category: number;
    location: number;
    color: number;
    date: number;
    description: number;
  };
  reason: string;
}

// Clean and normalize text
function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
}

// Compute Jaccard token similarity (0 to 1)
function tokenSimilarity(text1: string, text2: string): number {
  const tokens1 = new Set(tokenize(text1));
  const tokens2 = new Set(tokenize(text2));
  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let intersection = 0;
  for (const t of tokens1) {
    if (tokens2.has(t)) {
      intersection++;
    }
  }

  const union = new Set([...tokens1, ...tokens2]).size;
  return union === 0 ? 0 : intersection / union;
}

// Calculate match score between a Lost Item and a Found Item
export function calculateMatchScore(lostItem: any, foundItem: any): MatchResult {
  // 1. Category comparison (Weight: 30%)
  const categoryMatch = lostItem.category_id === foundItem.category_id ? 100 : 0;

  // 2. Location comparison (Weight: 20%)
  let locationMatch = 0;
  if (lostItem.location_id === foundItem.location_id) {
    locationMatch = 100;
  } else {
    const sim = tokenSimilarity(lostItem.location_name || '', foundItem.location_name || '');
    locationMatch = Math.round(sim * 70);
  }

  // 3. Color comparison (Weight: 15%)
  let colorMatch = 0;
  const lostColor = (lostItem.color || '').trim().toLowerCase();
  const foundColor = (foundItem.color || '').trim().toLowerCase();
  if (lostColor && foundColor) {
    if (lostColor === foundColor) {
      colorMatch = 100;
    } else if (lostColor.includes(foundColor) || foundColor.includes(lostColor)) {
      colorMatch = 80;
    }
  }

  // 4. Date comparison (Weight: 15%)
  let dateMatch = 50;
  try {
    const lostDate = new Date(lostItem.date_lost).getTime();
    const foundDate = new Date(foundItem.date_found).getTime();
    const diffDays = Math.abs((foundDate - lostDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      dateMatch = 100;
    } else if (diffDays <= 2) {
      dateMatch = 90;
    } else if (diffDays <= 7) {
      dateMatch = 75;
    } else if (diffDays <= 14) {
      dateMatch = 60;
    } else if (diffDays <= 30) {
      dateMatch = 40;
    } else {
      dateMatch = 10;
    }
  } catch (err) {
    dateMatch = 50;
  }

  // 5. Item Name & Description similarity (Weight: 20%)
  const nameSim = tokenSimilarity(lostItem.item_name, foundItem.item_name);
  const descSim = tokenSimilarity(lostItem.description || '', foundItem.description || '');
  const descriptionScore = Math.round((nameSim * 0.6 + descSim * 0.4) * 100);

  // Overall Weighted Score
  const totalScore = Math.round(
    categoryMatch * 0.30 +
    locationMatch * 0.20 +
    colorMatch * 0.15 +
    dateMatch * 0.15 +
    descriptionScore * 0.20
  );

  // Build human-readable reason
  const reasons: string[] = [];
  if (categoryMatch === 100) reasons.push('Matching category');
  if (locationMatch === 100) reasons.push('Found in same campus location');
  if (colorMatch >= 80) reasons.push(`Matching color (${lostColor})`);
  if (nameSim > 0.3) reasons.push('Strong item title match');
  if (dateMatch >= 75) reasons.push('Reported within close timeframe');

  const reason = reasons.length > 0 ? reasons.join(' • ') : 'General characteristic similarity';

  return {
    score: Math.min(100, Math.max(0, totalScore)),
    breakdown: {
      category: categoryMatch,
      location: locationMatch,
      color: colorMatch,
      date: dateMatch,
      description: descriptionScore,
    },
    reason,
  };
}

// Run matching for a specific lost item against all active found items
export async function runMatchingForLostItem(lostItemId: string) {
  const lostItem = await db.prepare(`
    SELECT l.*, loc.name as location_name, cat.name as category_name
     FROM lost_items l
     LEFT JOIN locations loc ON l.location_id = loc.id
     LEFT JOIN categories cat ON l.category_id = cat.id
     WHERE l.id = ?
  `).get(lostItemId) as any;

  if (!lostItem) return;

  const foundItems = await db.prepare(`
    SELECT f.*, loc.name as location_name, cat.name as category_name
     FROM found_items f
     LEFT JOIN locations loc ON f.location_id = loc.id
     LEFT JOIN categories cat ON f.category_id = cat.id
     WHERE f.status IN ('Found', 'Under Verification')
  `).all() as any[];

  for (const foundItem of foundItems) {
    const match = calculateMatchScore(lostItem, foundItem);
    if (match.score >= 50) {
      const existing = await db.prepare(`
        SELECT id FROM matches WHERE lost_item_id = ? AND found_item_id = ?
      `).get(lostItem.id, foundItem.id) as any;

      if (existing) {
        await db.prepare(`
          UPDATE matches 
          SET match_score = ?, match_breakdown = ?, match_reason = ?
          WHERE id = ?
        `).run(match.score, JSON.stringify(match.breakdown), match.reason, existing.id);
      } else {
        const matchId = 'match_' + crypto.randomBytes(8).toString('hex');
        await db.prepare(`
          INSERT INTO matches (id, lost_item_id, found_item_id, match_score, match_breakdown, match_reason, status)
          VALUES (?, ?, ?, ?, ?, ?, 'Suggested')
        `).run(matchId, lostItem.id, foundItem.id, match.score, JSON.stringify(match.breakdown), match.reason);

        // Send notification to lost item owner
        const notifId = 'notif_' + crypto.randomBytes(8).toString('hex');
        await db.prepare(`
          INSERT INTO notifications (id, user_id, title, message, notification_type, link)
          VALUES (?, ?, ?, ?, 'match', ?)
        `).run(
          notifId,
          lostItem.reporter_id,
          `Possible Match Found (${match.score}%)`,
          `A found item (${foundItem.item_name}) at ${foundItem.location_name || 'campus'} matches your lost report #${lostItem.item_reference}.`,
          `/items/found/${foundItem.id}`
        );

        // Update lost item status to 'Possible Match' if it was 'Lost'
        if (lostItem.status === 'Lost') {
          await db.prepare(`UPDATE lost_items SET status = 'Possible Match', updated_at = datetime('now') WHERE id = ?`).run(lostItem.id);
        }
      }
    }
  }
}

// Run matching for a newly reported found item against all active lost items
export async function runMatchingForFoundItem(foundItemId: string) {
  const foundItem = await db.prepare(`
    SELECT f.*, loc.name as location_name, cat.name as category_name
     FROM found_items f
     LEFT JOIN locations loc ON f.location_id = loc.id
     LEFT JOIN categories cat ON f.category_id = cat.id
     WHERE f.id = ?
  `).get(foundItemId) as any;

  if (!foundItem) return;

  const lostItems = await db.prepare(`
    SELECT l.*, loc.name as location_name, cat.name as category_name
     FROM lost_items l
     LEFT JOIN locations loc ON l.location_id = loc.id
     LEFT JOIN categories cat ON l.category_id = cat.id
     WHERE l.status IN ('Lost', 'Possible Match')
  `).all() as any[];

  for (const lostItem of lostItems) {
    const match = calculateMatchScore(lostItem, foundItem);
    if (match.score >= 50) {
      const existing = await db.prepare(`
        SELECT id FROM matches WHERE lost_item_id = ? AND found_item_id = ?
      `).get(lostItem.id, foundItem.id) as any;

      if (existing) {
        await db.prepare(`
          UPDATE matches 
          SET match_score = ?, match_breakdown = ?, match_reason = ?
          WHERE id = ?
        `).run(match.score, JSON.stringify(match.breakdown), match.reason, existing.id);
      } else {
        const matchId = 'match_' + crypto.randomBytes(8).toString('hex');
        await db.prepare(`
          INSERT INTO matches (id, lost_item_id, found_item_id, match_score, match_breakdown, match_reason, status)
          VALUES (?, ?, ?, ?, ?, ?, 'Suggested')
        `).run(matchId, lostItem.id, foundItem.id, match.score, JSON.stringify(match.breakdown), match.reason);

        // Notify lost item owner
        const notifId = 'notif_' + crypto.randomBytes(8).toString('hex');
        await db.prepare(`
          INSERT INTO notifications (id, user_id, title, message, notification_type, link)
          VALUES (?, ?, ?, ?, 'match', ?)
        `).run(
          notifId,
          lostItem.reporter_id,
          `Possible Match Found (${match.score}%)`,
          `A newly reported found item (${foundItem.item_name}) matches your lost report #${lostItem.item_reference}.`,
          `/items/found/${foundItem.id}`
        );

        if (lostItem.status === 'Lost') {
          await db.prepare(`UPDATE lost_items SET status = 'Possible Match', updated_at = datetime('now') WHERE id = ?`).run(lostItem.id);
        }
      }
    }
  }
}
