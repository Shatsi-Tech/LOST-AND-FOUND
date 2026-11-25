-- ====================================================================
-- CAMPUS LOST AND FOUND SYSTEM — COMPLETE SUPABASE SETUP SCRIPT
-- Project: ynrbbpmfdqowxuvexfxt
-- ====================================================================

-- 1. DROP EXISTING TABLES (Clean Slate)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS handovers CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS found_items CASCADE;
DROP TABLE IF EXISTS lost_items CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. CREATE TABLES
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  student_staff_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'officer', 'admin')),
  account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'suspended')),
  department TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Package',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE locations (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  zone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lost_items (
  id TEXT PRIMARY KEY,
  item_reference TEXT UNIQUE NOT NULL,
  reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id),
  item_name TEXT NOT NULL,
  description TEXT NOT NULL,
  color TEXT NOT NULL,
  date_lost TEXT NOT NULL,
  approximate_time TEXT,
  location_id TEXT NOT NULL REFERENCES locations(id),
  additional_info TEXT,
  contact_phone TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'Lost' CHECK (status IN ('Lost', 'Possible Match', 'Under Verification', 'Claim Approved', 'Returned', 'Closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE found_items (
  id TEXT PRIMARY KEY,
  item_reference TEXT UNIQUE NOT NULL,
  reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id),
  item_name TEXT NOT NULL,
  description TEXT NOT NULL,
  color TEXT NOT NULL,
  date_found TEXT NOT NULL,
  approximate_time TEXT,
  location_id TEXT NOT NULL REFERENCES locations(id),
  current_storage_location TEXT NOT NULL,
  is_handed_to_security INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  additional_notes TEXT,
  is_valuable INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Found' CHECK (status IN ('Found', 'Under Verification', 'Claim Approved', 'Returned', 'Unclaimed', 'Archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE claims (
  id TEXT PRIMARY KEY,
  claim_reference TEXT UNIQUE NOT NULL,
  found_item_id TEXT NOT NULL REFERENCES found_items(id) ON DELETE CASCADE,
  lost_item_id TEXT REFERENCES lost_items(id) ON DELETE SET NULL,
  claimant_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ownership_evidence TEXT NOT NULL,
  identifying_marks TEXT,
  purchase_info TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Under Review', 'Approved', 'Rejected', 'Info Requested')),
  rejection_reason TEXT,
  admin_notes TEXT,
  reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  lost_item_id TEXT NOT NULL REFERENCES lost_items(id) ON DELETE CASCADE,
  found_item_id TEXT NOT NULL REFERENCES found_items(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL,
  match_breakdown TEXT,
  match_reason TEXT,
  status TEXT NOT NULL DEFAULT 'Suggested' CHECK (status IN ('Suggested', 'Dismissed', 'Claimed', 'Confirmed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(lost_item_id, found_item_id)
);

CREATE TABLE handovers (
  id TEXT PRIMARY KEY,
  handover_reference TEXT UNIQUE NOT NULL,
  claim_id TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  found_item_id TEXT NOT NULL REFERENCES found_items(id) ON DELETE CASCADE,
  recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  officer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  handover_date TEXT NOT NULL,
  handover_time TEXT NOT NULL,
  id_verified INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'Completed' CHECK (status IN ('Completed', 'Cancelled')),
  notes TEXT,
  signature_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('match', 'claim_status', 'report_status', 'handover', 'system')),
  link TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  description TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_lost_reporter ON lost_items(reporter_id);
CREATE INDEX IF NOT EXISTS idx_found_reporter ON found_items(reporter_id);
CREATE INDEX IF NOT EXISTS idx_lost_category ON lost_items(category_id);
CREATE INDEX IF NOT EXISTS idx_found_category ON found_items(category_id);
CREATE INDEX IF NOT EXISTS idx_lost_status ON lost_items(status);
CREATE INDEX IF NOT EXISTS idx_found_status ON found_items(status);
CREATE INDEX IF NOT EXISTS idx_claims_found ON claims(found_item_id);
CREATE INDEX IF NOT EXISTS idx_claims_claimant ON claims(claimant_id);
CREATE INDEX IF NOT EXISTS idx_matches_pair ON matches(lost_item_id, found_item_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- 4. CREATE EXEC_SQL RPC FUNCTION (Used by backend API)
CREATE OR REPLACE FUNCTION exec_sql(query_text TEXT, params JSONB DEFAULT '[]'::jsonb)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result      JSONB;
  final_q     TEXT;
  clean_q     TEXT;
  idx         INT;
  pval        TEXT;
  row_count   BIGINT;
  params_arr  JSONB;
BEGIN
  final_q := query_text;

  IF params IS NULL THEN
    params_arr := '[]'::jsonb;
  ELSIF jsonb_typeof(params) = 'array' THEN
    params_arr := params;
  ELSIF jsonb_typeof(params) = 'string' THEN
    BEGIN
      params_arr := params::text::jsonb;
      IF jsonb_typeof(params_arr) != 'array' THEN
        params_arr := jsonb_build_array(params);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      params_arr := '[]'::jsonb;
    END;
  ELSE
    params_arr := jsonb_build_array(params);
  END IF;

  IF jsonb_array_length(params_arr) > 0 THEN
    FOR idx IN REVERSE (jsonb_array_length(params_arr) - 1) .. 0
    LOOP
      pval := params_arr ->> idx;
      IF pval IS NULL THEN
        final_q := regexp_replace(final_q, '\$' || (idx + 1) || '(?!\d)', 'NULL', 'g');
      ELSE
        final_q := regexp_replace(final_q, '\$' || (idx + 1) || '(?!\d)', replace(quote_literal(pval), '\', '\\'), 'g');
      END IF;
    END LOOP;
  END IF;

  -- Strip all leading whitespace, newlines, tabs, and comments
  clean_q := regexp_replace(final_q, '^\s+', '');

  -- SELECT / WITH -> return rows as a JSONB array
  IF upper(clean_q) LIKE 'SELECT%' OR upper(clean_q) LIKE 'WITH%' THEN
    clean_q := regexp_replace(clean_q, ';\s*$', '');
    EXECUTE
      'SELECT COALESCE(jsonb_agg(t), ''[]''::jsonb) FROM (' || clean_q || ') t'
    INTO result;
    RETURN COALESCE(result, '[]'::JSONB);
  ELSE
    -- INSERT / UPDATE / DELETE / DDL -> return affected row count
    EXECUTE final_q;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RETURN jsonb_build_object('rowCount', COALESCE(row_count, 0));
  END IF;

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'exec_sql error: % | query: %', SQLERRM, final_q;
END;
$$;

GRANT EXECUTE ON FUNCTION exec_sql(TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION exec_sql(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(TEXT, JSONB) TO anon;

-- 5. SEED INITIAL CATEGORIES
INSERT INTO categories (id, name, description, icon, status) VALUES
  ('cat_electronics', 'Electronics', 'General electrical devices, chargers, power banks, headphones', 'Cpu', 'active'),
  ('cat_phones', 'Mobile Phones', 'Smartphones, feature phones, cellular devices', 'Smartphone', 'active'),
  ('cat_laptops', 'Laptops', 'Notebooks, MacBooks, gaming laptops, chargers', 'Laptop', 'active'),
  ('cat_tablets', 'Tablets', 'iPads, Android tablets, e-readers', 'Tablet', 'active'),
  ('cat_student_ids', 'Student IDs', 'Campus ID cards, library passes, access badges', 'CreditCard', 'active'),
  ('cat_books', 'Books', 'Textbooks, library books, novels, course readers', 'Book', 'active'),
  ('cat_wallets', 'Wallets', 'Wallets, purses, money clips, cardholders', 'Wallet', 'active'),
  ('cat_keys', 'Keys', 'Hostel keys, car keys, locker keys, keychains', 'Key', 'active'),
  ('cat_bags', 'Bags', 'Backpacks, tote bags, laptop bags, gym sacks', 'ShoppingBag', 'active'),
  ('cat_clothing', 'Clothing', 'Jackets, hoodies, caps, scarves, lab coats', 'Shirt', 'active'),
  ('cat_jewellery', 'Jewellery', 'Watches, rings, necklaces, bracelets', 'Watch', 'active'),
  ('cat_academic', 'Academic Materials', 'Calculators, lab manuals, drawing boards, notebooks', 'GraduationCap', 'active'),
  ('cat_documents', 'Documents', 'Passports, certificates, examination slips, files', 'FileText', 'active'),
  ('cat_accessories', 'Accessories', 'Glasses, sunglasses, umbrellas, water bottles', 'Glasses', 'active'),
  ('cat_other', 'Other', 'Miscellaneous campus items', 'HelpCircle', 'active')
ON CONFLICT (id) DO NOTHING;

-- 6. SEED INITIAL LOCATIONS
INSERT INTO locations (id, name, description, zone, status) VALUES
  ('loc_library', 'Main Library', 'Central campus library & study cubicles', 'Academic Zone', 'active'),
  ('loc_ict_lab', 'ICT Laboratory', 'Computing center & software research labs', 'Science & Tech', 'active'),
  ('loc_block_a', 'Lecture Block A', 'Undergraduate lecture halls A1 - A10', 'Academic Zone', 'active'),
  ('loc_block_b', 'Lecture Block B', 'Postgraduate & seminar rooms B1 - B8', 'Academic Zone', 'active'),
  ('loc_theatre', 'Main Lecture Theatre', '500-seat university auditorium', 'Central Zone', 'active'),
  ('loc_cafeteria', 'University Cafeteria', 'Main dining hall & food court', 'Student Services', 'active'),
  ('loc_admin', 'Administration Block', 'Registrar, Dean of Students & Finance', 'Admin Zone', 'active'),
  ('loc_hostels', 'Student Hostels / Hall', 'Campus residential halls & common rooms', 'Residential Zone', 'active'),
  ('loc_sports', 'Sports Ground & Pavilion', 'Athletics track, gymnasium, soccer field', 'Sports Zone', 'active'),
  ('loc_parking', 'Main Parking Area', 'North campus staff & student vehicle parking', 'Perimeter', 'active'),
  ('loc_science_lab', 'Science Complex Laboratories', 'Chemistry, Physics & Biology wet labs', 'Science & Tech', 'active'),
  ('loc_student_center', 'Student Union Center', 'Clubs, student lounge, recreation hall', 'Student Services', 'active')
ON CONFLICT (id) DO NOTHING;

-- 7. SEED USERS (Passwords: admin123, officer123, student123)
INSERT INTO users (id, full_name, student_staff_id, email, phone, password, role, account_status, department, avatar_url, created_at) VALUES
  ('usr_admin', 'Dr. Michael Sterling', 'ADM-2024-001', 'admin@campus.edu', '+1 (555) 019-2831', '$2a$10$fQNPaJwKxo2484ueddg4tuw4apkRxjvAAr1Mu9OV3ZCOSwhkEWyQK', 'admin', 'active', 'Campus Administration & Dean of Students', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', NOW() - INTERVAL '30 days'),
  ('usr_officer', 'Officer Raymond Vance', 'SEC-2024-004', 'security@campus.edu', '+1 (555) 019-5520', '$2a$10$QDJy5gduk89ktEZKB37B8OluwEtKVpe973hZ1St/MolBH9Mrs9XyO', 'officer', 'active', 'Campus Security & Lost Property Desk', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', NOW() - INTERVAL '30 days'),
  ('usr_alex', 'Alex Kim', 'STU-2024-8891', 'alex.kim@campus.edu', '+1 (555) 019-3829', '$2a$10$UU65rMsRjqsQOEAlzdUDluuEPX7d1mxVgDZfPDvlEmEpgyYQTrdDa', 'student', 'active', 'Computer Science & Software Eng', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', NOW() - INTERVAL '30 days'),
  ('usr_sarah', 'Sarah Chen', 'STU-2024-5120', 'sarah.chen@campus.edu', '+1 (555) 019-7411', '$2a$10$UU65rMsRjqsQOEAlzdUDluuEPX7d1mxVgDZfPDvlEmEpgyYQTrdDa', 'student', 'active', 'Electrical & Electronics Engineering', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', NOW() - INTERVAL '30 days'),
  ('usr_marcus', 'Marcus Johnson', 'STU-2024-3312', 'marcus.johnson@campus.edu', '+1 (555) 019-8832', '$2a$10$UU65rMsRjqsQOEAlzdUDluuEPX7d1mxVgDZfPDvlEmEpgyYQTrdDa', 'student', 'active', 'School of Business & Finance', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', NOW() - INTERVAL '30 days'),
  ('usr_emily', 'Emily Davis', 'STU-2024-7744', 'emily.davis@campus.edu', '+1 (555) 019-4190', '$2a$10$UU65rMsRjqsQOEAlzdUDluuEPX7d1mxVgDZfPDvlEmEpgyYQTrdDa', 'student', 'active', 'Faculty of Health Sciences', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80', NOW() - INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

-- 8. SEED SAMPLE LOST ITEMS
INSERT INTO lost_items (id, item_reference, reporter_id, category_id, item_name, description, color, date_lost, approximate_time, location_id, additional_info, contact_phone, image_url, status, created_at, updated_at) VALUES
  ('lost_01', 'LOST-2026-0001', 'usr_sarah', 'cat_laptops', 'HP Pavilion 15 Laptop (Dark Gray)', '15-inch HP laptop in dark gray/black case. Has a GitHub and React sticker on the lid. Left near the 2nd floor library study carrels.', 'Black', '2026-08-25', '14:30', 'loc_library', 'Serial number ends with 8829. Contains CS thesis notes on desktop.', '+1 (555) 019-7411', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80', 'Possible Match', NOW() - INTERVAL '2 days', NOW()),
  ('lost_02', 'LOST-2026-0002', 'usr_marcus', 'cat_wallets', 'Fossil Brown Leather Bi-fold Wallet', 'Brown leather wallet lost during evening workout at the sports bleachers. Contains student ID and transit pass.', 'Brown', '2026-08-24', '18:15', 'loc_sports', 'Has Marcus Johnson student card inside and small copper coin.', '+1 (555) 019-8832', 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80', 'Possible Match', NOW() - INTERVAL '2 days', NOW()),
  ('lost_03', 'LOST-2026-0003', 'usr_alex', 'cat_phones', 'iPhone 14 Pro (Space Gray)', 'Apple iPhone 14 Pro 128GB in clear shockproof case. Lost during Software Architecture class in Lecture Block A.', 'Space Gray', '2026-08-26', '10:45', 'loc_block_a', 'Lock screen wallpaper is Mt. Fuji at sunset. IMEI ending in 4109.', '+1 (555) 019-3829', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80', 'Lost', NOW() - INTERVAL '2 days', NOW()),
  ('lost_04', 'LOST-2026-0004', 'usr_emily', 'cat_student_ids', 'University Student ID Card - Emily Davis', 'Official campus photo ID card for Health Sciences faculty with blue university lanyard attached.', 'Blue', '2026-08-25', '12:20', 'loc_cafeteria', 'Student ID: STU-2024-7744', '+1 (555) 019-4190', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80', 'Claim Approved', NOW() - INTERVAL '2 days', NOW()),
  ('lost_05', 'LOST-2026-0005', 'usr_alex', 'cat_electronics', 'Kingston 64GB DataTraveler USB Drive', 'Silver metallic Kingston USB 3.0 flash drive with a small red string tied to the keychain hole.', 'Silver', '2026-08-20', '16:00', 'loc_ict_lab', 'Contains AI coursework repository and Linux ISO.', '+1 (555) 019-3829', 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600&auto=format&fit=crop&q=80', 'Returned', NOW() - INTERVAL '2 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- 9. SEED SAMPLE FOUND ITEMS
INSERT INTO found_items (id, item_reference, reporter_id, category_id, item_name, description, color, date_found, approximate_time, location_id, current_storage_location, is_handed_to_security, additional_notes, is_valuable, image_url, status, created_at, updated_at) VALUES
  ('found_01', 'FOUND-2026-0001', 'usr_alex', 'cat_laptops', 'HP Pavilion Laptop (Dark Finish)', 'Found dark gray HP laptop left on a study desk on Level 2 of Main Library near quiet zone.', 'Black', '2026-08-25', '15:10', 'loc_library', 'Central Security Office - Locker B4', 1, 'Tech stickers on top cover (React logo). Power cable included.', 1, 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80', 'Under Verification', NOW() - INTERVAL '2 days', NOW()),
  ('found_02', 'FOUND-2026-0002', 'usr_alex', 'cat_wallets', 'Brown Leather Bi-fold Wallet', 'Found leather wallet on the lower tier bleachers of the campus sports ground after evening matches.', 'Brown', '2026-08-24', '19:00', 'loc_sports', 'Sports Pavilion Lost & Found Box', 1, 'Contains student identification card and small cash notes.', 1, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80', 'Found', NOW() - INTERVAL '2 days', NOW()),
  ('found_03', 'FOUND-2026-0003', 'usr_sarah', 'cat_student_ids', 'Campus Student ID Card with Blue Lanyard', 'Found student ID card on table near salad bar in main university cafeteria.', 'Blue', '2026-08-25', '13:00', 'loc_cafeteria', 'Cafeteria Manager Office / Security Front Desk', 1, 'Name on card: Emily Davis (Health Sciences).', 0, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80', 'Claim Approved', NOW() - INTERVAL '2 days', NOW()),
  ('found_04', 'FOUND-2026-0004', 'usr_officer', 'cat_keys', 'Toyota Car Key with Navy Blue Lanyard', 'Found set of vehicle keys with electronic remote fob and gym tag in Parking Zone B.', 'Black', '2026-08-26', '09:00', 'loc_parking', 'Central Security Office - Key Cabinet #12', 1, 'Has a small silver whistle attached to the ring.', 1, 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80', 'Found', NOW() - INTERVAL '2 days', NOW()),
  ('found_05', 'FOUND-2026-0005', 'usr_officer', 'cat_bags', 'North Face Black Commuter Backpack', 'Found black nylon backpack left in the Student Center lounge 1st floor.', 'Black', '2026-08-23', '17:30', 'loc_student_center', 'Central Security Office - Storage Room A', 1, 'Contains engineering textbooks and stainless steel tumbler.', 0, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80', 'Found', NOW() - INTERVAL '2 days', NOW()),
  ('found_06', 'FOUND-2026-0006', 'usr_officer', 'cat_electronics', 'Kingston 64GB Metal USB Flash Drive', 'Found plugged into Computer Station #14 in ICT Laboratory.', 'Silver', '2026-08-20', '17:00', 'loc_ict_lab', 'Central Security Office - Archive Bin 3', 1, 'Red thread tied to loop.', 0, 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600&auto=format&fit=crop&q=80', 'Returned', NOW() - INTERVAL '2 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- 10. SEED SAMPLE MATCHES
INSERT INTO matches (id, lost_item_id, found_item_id, match_score, match_breakdown, match_reason, status, created_at) VALUES
  ('match_01', 'lost_01', 'found_01', 94, '{"category":100,"location":100,"color":100,"date":90,"description":80}', 'Matching category (Laptops) • Found in same campus location (Main Library) • Matching color (Black) • Reported within close timeframe', 'Claimed', NOW() - INTERVAL '1 days'),
  ('match_02', 'lost_02', 'found_02', 92, '{"category":100,"location":100,"color":100,"date":90,"description":75}', 'Matching category (Wallets) • Found in same campus location (Sports Ground) • Matching color (Brown)', 'Suggested', NOW() - INTERVAL '1 days'),
  ('match_03', 'lost_04', 'found_03', 96, '{"category":100,"location":100,"color":100,"date":100,"description":85}', 'Matching category (Student IDs) • Found in same campus location (Cafeteria) • Matching color (Blue)', 'Confirmed', NOW() - INTERVAL '1 days')
ON CONFLICT (lost_item_id, found_item_id) DO NOTHING;

-- 11. SEED SAMPLE CLAIMS
INSERT INTO claims (id, claim_reference, found_item_id, lost_item_id, claimant_id, ownership_evidence, identifying_marks, purchase_info, status, admin_notes, reviewed_by, reviewed_at, created_at, updated_at) VALUES
  ('claim_01', 'CLAIM-2026-00451', 'found_01', 'lost_01', 'usr_sarah', 'The laptop serial is 5CD8829K91. It has a sticker of the React atom logo and GitHub Octocat on the top shell. The desktop wallpaper is an anime artwork.', 'Small scratch near HDMI port on left edge. Dual-boot Ubuntu/Windows 11.', 'Purchased at University Campus Tech Store, August 2024 (Invoice #CS-44910).', 'Under Review', 'Evidence matches found item sticker description. Ready for final approval.', 'usr_admin', NULL, NOW() - INTERVAL '1 days', NOW()),
  ('claim_02', 'CLAIM-2026-00452', 'found_03', 'lost_04', 'usr_emily', 'My student ID card #STU-2024-7744 with Faculty of Health Sciences emblem and blue university lanyard.', 'Has a small heart sticker on the back plastic card protector.', 'Issued by Campus Registrar Office.', 'Approved', 'Verified identity and student records match perfectly. Collection pass authorized.', 'usr_admin', '2026-08-26 11:30:00', NOW() - INTERVAL '1 days', NOW()),
  ('claim_03', 'CLAIM-2026-00450', 'found_06', 'lost_05', 'usr_alex', 'Silver Kingston USB drive with red string loop. Contains folder labeled /CS302_Projects and AlexKim_Resume.pdf.', 'Engraved 64GB DT50 on back casing.', 'Bought online Amazon.', 'Approved', 'Folder contents confirmed by security officer.', 'usr_officer', '2026-08-21 14:00:00', NOW() - INTERVAL '1 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- 12. SEED SAMPLE HANDOVERS
INSERT INTO handovers (id, handover_reference, claim_id, found_item_id, recipient_id, officer_id, handover_date, handover_time, id_verified, status, notes, signature_name, created_at) VALUES
  ('hand_01', 'HAND-2026-0001', 'claim_03', 'found_06', 'usr_alex', 'usr_officer', '2026-08-21', '15:30', 1, 'Completed', 'Physical student ID verified (Alex Kim - STU-2024-8891). Student verified contents of USB drive on officer terminal before signing.', 'Alex Kim', NOW() - INTERVAL '6 days')
ON CONFLICT (id) DO NOTHING;

-- 13. SEED SAMPLE NOTIFICATIONS
INSERT INTO notifications (id, user_id, title, message, notification_type, link, is_read, created_at) VALUES
  ('notif_01', 'usr_sarah', 'Possible Match Found (94%)', 'A found HP Pavilion Laptop at Main Library matches your lost report #LOST-2026-0001.', 'match', '/items/found/found_01', 0, NOW() - INTERVAL '1 days'),
  ('notif_02', 'usr_emily', 'Claim Approved — Ready for Collection', 'Your claim #CLAIM-2026-00452 for "Student ID Card" has been approved! Please visit the security desk with reference #CLAIM-2026-00452.', 'claim_status', '/dashboard/claims', 0, NOW() - INTERVAL '1 days'),
  ('notif_03', 'usr_marcus', 'Possible Match Detected (92%)', 'A found Brown Leather Bi-fold Wallet at Sports Ground matches your lost report #LOST-2026-0002.', 'match', '/items/found/found_02', 1, NOW() - INTERVAL '1 days'),
  ('notif_04', 'usr_alex', 'Item Successfully Recovered!', 'Your item "Kingston 64GB Metal USB Flash Drive" has been officially handed over to you (Handover Ref: #HAND-2026-0001).', 'handover', '/dashboard/claims', 1, NOW() - INTERVAL '1 days')
ON CONFLICT (id) DO NOTHING;

-- 14. SEED SAMPLE AUDIT LOGS
INSERT INTO audit_logs (id, user_id, user_name, action, entity_type, entity_id, description, created_at) VALUES
  ('audit_01', 'usr_sarah', 'Sarah Chen', 'REPORT_LOST', 'lost_item', 'lost_01', 'Reported lost item #LOST-2026-0001: HP Pavilion 15 Laptop', NOW() - INTERVAL '2 days'),
  ('audit_02', 'usr_alex', 'Alex Kim', 'REPORT_FOUND', 'found_item', 'found_01', 'Reported found item #FOUND-2026-0001: HP Pavilion Laptop at Main Library', NOW() - INTERVAL '2 days'),
  ('audit_03', 'usr_sarah', 'Sarah Chen', 'SUBMIT_CLAIM', 'claim', 'claim_01', 'Submitted ownership claim #CLAIM-2026-00451 for item #FOUND-2026-0001', NOW() - INTERVAL '2 days'),
  ('audit_04', 'usr_admin', 'Dr. Michael Sterling', 'CLAIM_APPROVED', 'claim', 'claim_02', 'Approved claim #CLAIM-2026-00452 for Student ID Card (Emily Davis)', NOW() - INTERVAL '2 days'),
  ('audit_05', 'usr_officer', 'Officer Raymond Vance', 'ITEM_HANDOVER', 'handover', 'hand_01', 'Handover #HAND-2026-0001 completed for Kingston USB drive to Alex Kim', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;
