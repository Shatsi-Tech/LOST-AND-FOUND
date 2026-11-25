export type UserRole = 'student' | 'officer' | 'admin';
export type AccountStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  full_name: string;
  student_staff_id: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  account_status: AccountStatus;
  department?: string | null;
  avatar_url?: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  icon?: string;
  status: 'active' | 'inactive';
  lost_count?: number;
  found_count?: number;
  created_at?: string;
}

export interface CampusLocation {
  id: string;
  name: string;
  description?: string | null;
  zone?: string | null;
  status: 'active' | 'inactive';
  lost_count?: number;
  found_count?: number;
  created_at?: string;
}

export type ItemStatus =
  | 'Lost'
  | 'Found'
  | 'Possible Match'
  | 'Under Verification'
  | 'Claim Approved'
  | 'Returned'
  | 'Unclaimed'
  | 'Closed'
  | 'Archived';

export interface LostItem {
  id: string;
  item_reference: string;
  reporter_id: string;
  reporter_name?: string;
  reporter_email?: string;
  reporter_student_id?: string;
  category_id: string;
  category_name?: string;
  item_name: string;
  description: string;
  color: string;
  date_lost: string;
  approximate_time?: string | null;
  location_id: string;
  location_name?: string;
  additional_info?: string | null;
  contact_phone?: string | null;
  image_url?: string | null;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
  match_count?: number;
}

export interface FoundItem {
  id: string;
  item_reference: string;
  reporter_id: string;
  reporter_name?: string;
  reporter_email?: string;
  category_id: string;
  category_name?: string;
  item_name: string;
  description: string;
  color: string;
  date_found: string;
  approximate_time?: string | null;
  location_id: string;
  location_name?: string;
  current_storage_location: string;
  is_handed_to_security: number;
  additional_notes?: string | null;
  is_valuable: number;
  image_url?: string | null;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
  claim_count?: number;
}

export type ClaimStatus = 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Info Requested';

export interface Claim {
  id: string;
  claim_reference: string;
  found_item_id: string;
  lost_item_id?: string | null;
  claimant_id: string;
  claimant_name?: string;
  claimant_student_id?: string;
  claimant_email?: string;
  claimant_phone?: string;
  claimant_department?: string;
  found_name?: string;
  found_reference?: string;
  found_color?: string;
  found_image?: string;
  found_desc?: string;
  current_storage_location?: string;
  location_name?: string;
  category_name?: string;
  ownership_evidence: string;
  identifying_marks?: string | null;
  purchase_info?: string | null;
  status: ClaimStatus;
  rejection_reason?: string | null;
  admin_notes?: string | null;
  reviewed_by?: string | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchBreakdown {
  category: number;
  location: number;
  color: number;
  date: number;
  description: number;
}

export interface ItemMatch {
  id: string;
  lost_item_id: string;
  found_item_id: string;
  match_score: number;
  match_breakdown?: string | MatchBreakdown;
  match_reason: string;
  status: 'Suggested' | 'Dismissed' | 'Claimed' | 'Confirmed';
  created_at: string;
  found_name?: string;
  found_reference?: string;
  found_color?: string;
  found_image?: string;
  found_location_name?: string;
  found_category_name?: string;
  current_storage_location?: string;
  date_found?: string;
}

export interface Handover {
  id: string;
  handover_reference: string;
  claim_id: string;
  claim_reference?: string;
  found_item_id: string;
  item_name?: string;
  found_name?: string;
  found_reference?: string;
  found_color?: string;
  found_image?: string;
  location_name?: string;
  category_name?: string;
  recipient_id: string;
  recipient_name?: string;
  recipient_student_id?: string;
  recipient_email?: string;
  officer_id: string;
  officer_name?: string;
  officer_staff_id?: string;
  handover_date: string;
  handover_time: string;
  id_verified: number;
  status: 'Completed' | 'Cancelled';
  notes?: string | null;
  signature_name?: string | null;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: 'match' | 'claim_status' | 'report_status' | 'handover' | 'system';
  link?: string | null;
  is_read: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  user_name?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  description: string;
  ip_address?: string | null;
  created_at: string;
}

export interface PublicStats {
  total_lost: number;
  total_found: number;
  total_returned: number;
  active_users: number;
  recovery_rate: number;
  recent_found: FoundItem[];
}

export interface StudentDashboardSummary {
  my_lost: number;
  my_found: number;
  pending_claims: number;
  recovered: number;
  possible_matches: number;
  recent_activity: Array<{
    type: 'lost' | 'found' | 'claim';
    ref: string;
    title: string;
    status: string;
    created_at: string;
    id: string;
  }>;
}

export interface AdminAnalytics {
  kpis: {
    total_users: number;
    total_lost: number;
    total_found: number;
    pending_claims: number;
    approved_claims: number;
    rejected_claims: number;
    returned_items: number;
    unclaimed_items: number;
  };
  category_stats: Array<{
    name: string;
    lost_count: number;
    found_count: number;
  }>;
  location_stats: Array<{
    name: string;
    lost_count: number;
    found_count: number;
  }>;
  pending_claims: Claim[];
  recent_handovers: Handover[];
  recent_audit: AuditLog[];
}
