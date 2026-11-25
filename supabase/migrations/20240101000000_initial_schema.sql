-- Initial Schema for Lost-and-Found Campus System
-- Migration: 20240101000000_initial_schema

-- Create users table
CREATE TABLE IF NOT EXISTS users (
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

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Package',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  zone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create lost_items table
CREATE TABLE IF NOT EXISTS lost_items (
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

-- Create found_items table
CREATE TABLE IF NOT EXISTS found_items (
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

-- Create claims table
CREATE TABLE IF NOT EXISTS claims (
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

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
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

-- Create handovers table
CREATE TABLE IF NOT EXISTS handovers (
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

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('match', 'claim_status', 'report_status', 'handover', 'system')),
  link TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
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

-- Create indexes
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
