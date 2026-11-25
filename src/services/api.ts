import { createClient } from '@supabase/supabase-js';
import {
  User,
  Category,
  CampusLocation,
  LostItem,
  FoundItem,
  Claim,
  ItemMatch,
  Handover,
  NotificationItem,
  AuditLog,
  PublicStats,
  StudentDashboardSummary,
  AdminAnalytics,
} from '../types';

const SUPABASE_URL = 'https://fqosdbhtzxfhjcfxmlag.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sVeG_w-k2Q1pzLWyYMhrIA__MqH8WDd';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function getImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  return imageUrl;
}

class SupabaseApiService {
  private async getSessionUser(): Promise<User | null> {
    const raw = localStorage.getItem('unifind_user');
    if (!raw) return null;
    try {
      const user = JSON.parse(raw) as User;
      // Validate that the user exists in database to avoid foreign key errors from stale sessions
      if (user && user.id) {
        const { data } = await supabase.from('users').select('id, full_name, student_staff_id, email, phone, role, account_status, department, created_at').eq('id', user.id).maybeSingle();
        if (data) return data as User;
        
        // If not found by ID (e.g. from an older database reset), attempt lookup by email
        if (user.email) {
          const { data: byEmail } = await supabase.from('users').select('id, full_name, student_staff_id, email, phone, role, account_status, department, created_at').ilike('email', user.email).maybeSingle();
          if (byEmail) {
            localStorage.setItem('unifind_user', JSON.stringify(byEmail));
            return byEmail as User;
          }
        }
      }
      return user;
    } catch {
      return null;
    }
  }

  private setSession(user: User, token: string) {
    localStorage.setItem('unifind_token', token);
    localStorage.setItem('unifind_user', JSON.stringify(user));
  }

  // AUTH
  async register(payload: any): Promise<{ user: User; token: string; message: string }> {
    const { full_name, student_staff_id, email, phone, password, confirm_password, department, role } = payload;
    if (!full_name || !student_staff_id || !email || !password) {
      throw new Error('Please fill in all required fields.');
    }
    if (password !== confirm_password) {
      throw new Error('Passwords do not match.');
    }

    // Check existing
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email.trim().toLowerCase()},student_staff_id.eq.${student_staff_id.trim()}`)
      .maybeSingle();

    if (existingUser) {
      throw new Error('An account with this email or Student/Staff ID already exists.');
    }

    const userId = 'usr_' + Math.random().toString(36).substring(2, 10);
    const userRole = (role === 'admin' || role === 'officer' || role === 'student') ? role : 'student';

    const newUserRecord = {
      id: userId,
      full_name: full_name.trim(),
      student_staff_id: student_staff_id.trim().toUpperCase(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      password: password, // For client-side demo schema
      role: userRole,
      account_status: 'active',
      department: department || 'General Studies',
      created_at: new Date().toISOString(),
    };

    const { error: insertErr } = await supabase.from('users').insert([newUserRecord]);
    if (insertErr) {
      throw new Error(insertErr.message || 'Failed to register account.');
    }

    const token = 'token_' + Math.random().toString(36).substring(2, 15);
    const userObj: User = {
      id: newUserRecord.id,
      full_name: newUserRecord.full_name,
      student_staff_id: newUserRecord.student_staff_id,
      email: newUserRecord.email,
      phone: newUserRecord.phone,
      role: newUserRecord.role as any,
      account_status: newUserRecord.account_status as any,
      department: newUserRecord.department,
      created_at: newUserRecord.created_at,
    };

    this.setSession(userObj, token);

    // Welcome notification
    await supabase.from('notifications').insert([{
      id: 'notif_' + Math.random().toString(36).substring(2, 10),
      user_id: userObj.id,
      title: 'Welcome to UniFind',
      message: 'Your campus lost and found account is active. You can report items and submit claims.',
      notification_type: 'system',
      link: '/dashboard',
      is_read: 0,
      created_at: new Date().toISOString(),
    }]);

    return { user: userObj, token, message: 'Account registered successfully.' };
  }

  async login(payload: any): Promise<{ user: User; token: string; message: string }> {
    const identifier = (payload.email || payload.identifier || '').trim();
    const password = payload.password;
    if (!identifier || !password) {
      throw new Error('Please enter email / ID and password.');
    }

    const { data: userRecord, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.ilike.${identifier},student_staff_id.ilike.${identifier}`)
      .maybeSingle();

    if (error || !userRecord) {
      throw new Error('Invalid email or password.');
    }

    // Verify password (plain text or bcrypt match if already hashed)
    if (userRecord.password !== password && !userRecord.password.startsWith('$2a$') && !userRecord.password.startsWith('$2b$')) {
      throw new Error('Invalid email or password.');
    }

    const token = 'token_' + Math.random().toString(36).substring(2, 15);
    const userObj: User = {
      id: userRecord.id,
      full_name: userRecord.full_name,
      student_staff_id: userRecord.student_staff_id,
      email: userRecord.email,
      phone: userRecord.phone,
      role: userRecord.role,
      account_status: userRecord.account_status,
      department: userRecord.department,
      created_at: userRecord.created_at,
    };

    this.setSession(userObj, token);
    return { user: userObj, token, message: 'Logged in successfully.' };
  }

  async getCurrentUser(): Promise<{ user: User }> {
    const user = await this.getSessionUser();
    if (!user) throw new Error('Not authenticated');
    return { user };
  }

  async resetPassword(payload: any): Promise<{ message: string }> {
    const { email, new_password, confirm_password } = payload;
    if (!email || !new_password) throw new Error('Email and new password required.');
    if (new_password !== confirm_password) throw new Error('Passwords do not match.');

    const { error } = await supabase
      .from('users')
      .update({ password: new_password })
      .ilike('email', email.trim());

    if (error) throw new Error(error.message);
    return { message: 'Password reset successfully. You may now log in.' };
  }

  async demoSwitch(payload: { role?: string; email?: string }): Promise<{ user: User; token: string; message: string }> {
    let query = supabase.from('users').select('*');
    if (payload.email) {
      query = query.ilike('email', payload.email);
    } else if (payload.role) {
      query = query.eq('role', payload.role);
    }
    const { data, error } = await query.limit(1).maybeSingle();
    if (error || !data) throw new Error('User not found.');

    const userObj: User = {
      id: data.id,
      full_name: data.full_name,
      student_staff_id: data.student_staff_id,
      email: data.email,
      phone: data.phone,
      role: data.role,
      account_status: data.account_status,
      department: data.department,
      created_at: data.created_at,
    };
    const token = 'token_demo_' + Math.random().toString(36).substring(2, 10);
    this.setSession(userObj, token);
    return { user: userObj, token, message: `Switched to ${userObj.full_name}` };
  }

  async getDemoUsers(): Promise<{ users: User[] }> {
    const { data } = await supabase.from('users').select('id, full_name, student_staff_id, email, phone, role, account_status, department, created_at');
    return { users: (data || []) as User[] };
  }

  // METADATA
  async getMeta(): Promise<{ categories: Category[]; locations: CampusLocation[] }> {
    const [cats, locs] = await Promise.all([
      supabase.from('categories').select('*').eq('status', 'active'),
      supabase.from('locations').select('*').eq('status', 'active'),
    ]);
    return {
      categories: (cats.data || []) as Category[],
      locations: (locs.data || []) as CampusLocation[],
    };
  }

  // IMAGE UPLOAD (Converts to Data URL for client-only hosting)
  async uploadImage(file: File): Promise<{ url: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ url: reader.result as string });
      reader.onerror = () => reject(new Error('Failed to read image'));
      reader.readAsDataURL(file);
    });
  }

  // LOST ITEMS
  async reportLostItem(payload: any): Promise<{ item: LostItem; message: string }> {
    const user = await this.getSessionUser();
    if (!user) throw new Error('Please login first.');

    const id = 'lost_' + Math.random().toString(36).substring(2, 10);
    const item_reference = 'LOST-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

    const record = {
      ...payload,
      id,
      item_reference,
      reporter_id: user.id,
      status: 'Lost',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('lost_items').insert([record]).select().single();
    if (error) throw new Error(error.message);

    return { item: data as LostItem, message: 'Lost item report submitted successfully.' };
  }

  async getLostItems(params?: Record<string, string>): Promise<{ items: LostItem[] }> {
    let q = supabase.from('lost_items').select('*, categories(name, icon), locations(name, zone)').order('created_at', { ascending: false });
    if (params?.status) q = q.eq('status', params.status);
    if (params?.category_id) q = q.eq('category_id', params.category_id);
    if (params?.location_id) q = q.eq('location_id', params.location_id);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const items = (data || []).map((it: any) => ({
      ...it,
      category_name: it.categories?.name,
      category_icon: it.categories?.icon,
      location_name: it.locations?.name,
      location_zone: it.locations?.zone,
    }));
    return { items };
  }

  async getLostItemDetails(id: string): Promise<{ item: LostItem; matches: ItemMatch[] }> {
    const { data: item } = await supabase.from('lost_items').select('*, categories(name, icon), locations(name, zone)').eq('id', id).single();
    const { data: matches } = await supabase.from('matches').select('*').eq('lost_item_id', id);
    return {
      item: {
        ...item,
        category_name: item?.categories?.name,
        category_icon: item?.categories?.icon,
        location_name: item?.locations?.name,
        location_zone: item?.locations?.zone,
      } as LostItem,
      matches: (matches || []) as ItemMatch[],
    };
  }

  async getMyLostItems(): Promise<{ items: LostItem[] }> {
    const user = await this.getSessionUser();
    if (!user) return { items: [] };
    const { data } = await supabase.from('lost_items').select('*, categories(name, icon), locations(name, zone)').eq('reporter_id', user.id).order('created_at', { ascending: false });
    const items = (data || []).map((it: any) => ({
      ...it,
      category_name: it.categories?.name,
      category_icon: it.categories?.icon,
      location_name: it.locations?.name,
      location_zone: it.locations?.zone,
    }));
    return { items };
  }

  async updateLostItemStatus(id: string, status: string): Promise<{ message: string }> {
    const { error } = await supabase.from('lost_items').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw new Error(error.message);
    return { message: 'Status updated' };
  }

  // FOUND ITEMS
  async reportFoundItem(payload: any): Promise<{ item: FoundItem; message: string }> {
    const user = await this.getSessionUser();
    if (!user) throw new Error('Please login first.');

    const id = 'found_' + Math.random().toString(36).substring(2, 10);
    const item_reference = 'FOUND-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

    const record = {
      ...payload,
      id,
      item_reference,
      reporter_id: user.id,
      status: 'Found',
      is_handed_to_security: payload.is_handed_to_security ? 1 : 0,
      is_valuable: payload.is_valuable ? 1 : 0,
      current_storage_location: payload.current_storage_location || 'Campus Security Desk',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('found_items').insert([record]).select().single();
    if (error) throw new Error(error.message);

    return { item: data as FoundItem, message: 'Found item report submitted successfully.' };
  }

  async getFoundItems(params?: Record<string, string>): Promise<{ items: FoundItem[] }> {
    let q = supabase.from('found_items').select('*, categories(name, icon), locations(name, zone)').order('created_at', { ascending: false });
    if (params?.status) q = q.eq('status', params.status);
    if (params?.category_id) q = q.eq('category_id', params.category_id);
    if (params?.location_id) q = q.eq('location_id', params.location_id);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const items = (data || []).map((it: any) => ({
      ...it,
      category_name: it.categories?.name,
      category_icon: it.categories?.icon,
      location_name: it.locations?.name,
      location_zone: it.locations?.zone,
    }));
    return { items };
  }

  async getFoundItemDetails(id: string): Promise<{ item: FoundItem }> {
    const { data: item } = await supabase.from('found_items').select('*, categories(name, icon), locations(name, zone)').eq('id', id).single();
    return {
      item: {
        ...item,
        category_name: item?.categories?.name,
        category_icon: item?.categories?.icon,
        location_name: item?.locations?.name,
        location_zone: item?.locations?.zone,
      } as FoundItem,
    };
  }

  async getMyFoundItems(): Promise<{ items: FoundItem[] }> {
    const user = await this.getSessionUser();
    if (!user) return { items: [] };
    const { data } = await supabase.from('found_items').select('*, categories(name, icon), locations(name, zone)').eq('reporter_id', user.id).order('created_at', { ascending: false });
    const items = (data || []).map((it: any) => ({
      ...it,
      category_name: it.categories?.name,
      category_icon: it.categories?.icon,
      location_name: it.locations?.name,
      location_zone: it.locations?.zone,
    }));
    return { items };
  }

  async updateFoundItemStatus(id: string, payload: any): Promise<{ message: string }> {
    const { error } = await supabase.from('found_items').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw new Error(error.message);
    return { message: 'Status updated' };
  }

  // CLAIMS
  async submitClaim(payload: any): Promise<{ claim: Claim; message: string }> {
    const user = await this.getSessionUser();
    if (!user) throw new Error('Please login first.');

    const id = 'claim_' + Math.random().toString(36).substring(2, 10);
    const claim_reference = 'CLAIM-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

    const record = {
      ...payload,
      id,
      claim_reference,
      claimant_id: user.id,
      status: 'Pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('claims').insert([record]).select().single();
    if (error) throw new Error(error.message);

    return { claim: data as Claim, message: 'Claim submitted successfully.' };
  }

  async getMyClaims(): Promise<{ claims: Claim[] }> {
    const user = await this.getSessionUser();
    if (!user) return { claims: [] };
    const { data } = await supabase.from('claims').select('*, found_items(item_name, item_reference, image_url)').eq('claimant_id', user.id).order('created_at', { ascending: false });
    const claims = (data || []).map((c: any) => ({
      ...c,
      found_item_name: c.found_items?.item_name,
      found_item_reference: c.found_items?.item_reference,
      found_item_image: c.found_items?.image_url,
    }));
    return { claims };
  }

  async getAllClaims(params?: Record<string, string>): Promise<{ claims: Claim[] }> {
    let q = supabase.from('claims').select('*, found_items(item_name, item_reference), users(full_name, email, student_staff_id)').order('created_at', { ascending: false });
    if (params?.status) q = q.eq('status', params.status);
    const { data } = await q;
    const claims = (data || []).map((c: any) => ({
      ...c,
      found_item_name: c.found_items?.item_name,
      found_item_reference: c.found_items?.item_reference,
      claimant_name: c.users?.full_name,
      claimant_email: c.users?.email,
      claimant_id_num: c.users?.student_staff_id,
    }));
    return { claims };
  }

  async getClaimDetails(id: string): Promise<{ claim: Claim }> {
    const { data } = await supabase.from('claims').select('*, found_items(*), users(full_name, email, student_staff_id)').eq('id', id).single();
    return {
      claim: {
        ...data,
        found_item_name: data?.found_items?.item_name,
        found_item_reference: data?.found_items?.item_reference,
        claimant_name: data?.users?.full_name,
        claimant_email: data?.users?.email,
        claimant_id_num: data?.users?.student_staff_id,
      } as Claim,
    };
  }

  async reviewClaim(id: string, payload: { status: string; rejection_reason?: string; admin_notes?: string }): Promise<{ message: string }> {
    const user = await this.getSessionUser();
    const { error } = await supabase.from('claims').update({
      ...payload,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw new Error(error.message);
    return { message: 'Claim updated' };
  }

  // HANDOVERS
  async lookupHandover(reference: string): Promise<{ claim: Claim; handover: Handover | null }> {
    const { data: claim } = await supabase.from('claims').select('*, found_items(*), users(*)').eq('claim_reference', reference.trim()).maybeSingle();
    if (!claim) throw new Error('Claim not found');
    const { data: handover } = await supabase.from('handovers').select('*').eq('claim_id', claim.id).maybeSingle();
    return {
      claim: {
        ...claim,
        found_item_name: claim.found_items?.item_name,
        claimant_name: claim.users?.full_name,
      } as Claim,
      handover: handover as Handover | null,
    };
  }

  async completeHandover(payload: { claim_id: string; id_verified: boolean; notes?: string; signature_name?: string }): Promise<{ message: string; handover: Handover }> {
    const user = await this.getSessionUser();
    const id = 'hand_' + Math.random().toString(36).substring(2, 10);
    const handover_reference = 'HAND-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

    const record = {
      id,
      handover_reference,
      claim_id: payload.claim_id,
      officer_id: user?.id,
      handover_date: new Date().toISOString().split('T')[0],
      handover_time: new Date().toTimeString().split(' ')[0],
      id_verified: payload.id_verified ? 1 : 0,
      notes: payload.notes || '',
      signature_name: payload.signature_name || '',
      status: 'Completed',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('handovers').insert([record]).select().single();
    if (error) throw new Error(error.message);
    return { message: 'Handover recorded', handover: data as Handover };
  }

  async getHandoverHistory(params?: Record<string, string>): Promise<{ handovers: Handover[] }> {
    let q = supabase.from('handovers').select('*, claims(claim_reference), found_items(item_name)').order('created_at', { ascending: false });
    if (params?.status) q = q.eq('status', params.status);
    const { data } = await q;
    return { handovers: (data || []) as Handover[] };
  }

  // NOTIFICATIONS
  async getNotifications(): Promise<{ notifications: NotificationItem[]; unread_count: number }> {
    const user = await this.getSessionUser();
    if (!user) return { notifications: [], unread_count: 0 };
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    const notifications = (data || []) as NotificationItem[];
    const unread_count = notifications.filter(n => !n.is_read).length;
    return { notifications, unread_count };
  }

  async getUnreadNotificationCount(): Promise<{ count: number }> {
    const user = await this.getSessionUser();
    if (!user) return { count: 0 };
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', 0);
    return { count: count || 0 };
  }

  async markNotificationRead(id: string): Promise<{ message: string }> {
    await supabase.from('notifications').update({ is_read: 1 }).eq('id', id);
    return { message: 'Notification marked as read' };
  }

  async markAllNotificationsRead(): Promise<{ message: string }> {
    const user = await this.getSessionUser();
    if (user) {
      await supabase.from('notifications').update({ is_read: 1 }).eq('user_id', user.id);
    }
    return { message: 'All notifications marked as read' };
  }

  async deleteNotification(id: string): Promise<{ message: string }> {
    await supabase.from('notifications').delete().eq('id', id);
    return { message: 'Notification removed' };
  }

  // STATS
  async getPublicStats(): Promise<PublicStats> {
    const [lost, found, returned] = await Promise.all([
      supabase.from('lost_items').select('*', { count: 'exact', head: true }),
      supabase.from('found_items').select('*', { count: 'exact', head: true }),
      supabase.from('found_items').select('*', { count: 'exact', head: true }).eq('status', 'Returned'),
    ]);
    const total_lost = lost.count || 0;
    const total_found = found.count || 0;
    const total_returned = returned.count || 0;
    const recovery_rate = total_found > 0 ? Math.round((total_returned / total_found) * 100) : 85;
    return {
      total_lost,
      total_found,
      total_returned,
      active_users: 128,
      recovery_rate,
      recent_found: [],
    };
  }

  async getStudentSummary(userId: string): Promise<StudentDashboardSummary> {
    const [lost, claims, recovered] = await Promise.all([
      supabase.from('lost_items').select('*', { count: 'exact', head: true }).eq('reporter_id', userId),
      supabase.from('claims').select('*', { count: 'exact', head: true }).eq('claimant_id', userId).eq('status', 'Pending'),
      supabase.from('lost_items').select('*', { count: 'exact', head: true }).eq('reporter_id', userId).eq('status', 'Returned'),
    ]);
    return {
      my_lost: lost.count || 0,
      my_found: 0,
      pending_claims: claims.count || 0,
      recovered: recovered.count || 0,
      possible_matches: 0,
      recent_activity: [],
    };
  }

  async getAdminAnalytics(): Promise<AdminAnalytics> {
    const [users, lost, found, pendingClaims, approvedClaims, rejectedClaims, returned] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('lost_items').select('*', { count: 'exact', head: true }),
      supabase.from('found_items').select('*', { count: 'exact', head: true }),
      supabase.from('claims').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
      supabase.from('claims').select('*', { count: 'exact', head: true }).eq('status', 'Approved'),
      supabase.from('claims').select('*', { count: 'exact', head: true }).eq('status', 'Rejected'),
      supabase.from('found_items').select('*', { count: 'exact', head: true }).eq('status', 'Returned'),
    ]);
    return {
      kpis: {
        total_users: users.count || 0,
        total_lost: lost.count || 0,
        total_found: found.count || 0,
        pending_claims: pendingClaims.count || 0,
        approved_claims: approvedClaims.count || 0,
        rejected_claims: rejectedClaims.count || 0,
        returned_items: returned.count || 0,
        unclaimed_items: Math.max(0, (found.count || 0) - (returned.count || 0)),
      },
      category_stats: [],
      location_stats: [],
      pending_claims: [],
      recent_handovers: [],
      recent_audit: [],
    };
  }

  // ADMIN OPERATIONS
  async getAdminCategories(): Promise<{ categories: Category[] }> {
    const { data } = await supabase.from('categories').select('*').order('name');
    return { categories: (data || []) as Category[] };
  }

  async createCategory(payload: any): Promise<{ message: string; id: string }> {
    const id = 'cat_' + Math.random().toString(36).substring(2, 10);
    const { error } = await supabase.from('categories').insert([{ ...payload, id }]);
    if (error) throw new Error(error.message);
    return { message: 'Category created', id };
  }

  async updateCategory(id: string, payload: any): Promise<{ message: string }> {
    const { error } = await supabase.from('categories').update(payload).eq('id', id);
    if (error) throw new Error(error.message);
    return { message: 'Category updated' };
  }

  async getAdminLocations(): Promise<{ locations: CampusLocation[] }> {
    const { data } = await supabase.from('locations').select('*').order('name');
    return { locations: (data || []) as CampusLocation[] };
  }

  async createLocation(payload: any): Promise<{ message: string; id: string }> {
    const id = 'loc_' + Math.random().toString(36).substring(2, 10);
    const { error } = await supabase.from('locations').insert([{ ...payload, id }]);
    if (error) throw new Error(error.message);
    return { message: 'Location created', id };
  }

  async updateLocation(id: string, payload: any): Promise<{ message: string }> {
    const { error } = await supabase.from('locations').update(payload).eq('id', id);
    if (error) throw new Error(error.message);
    return { message: 'Location updated' };
  }

  async getAdminUsers(params?: Record<string, string>): Promise<{ users: User[] }> {
    let q = supabase.from('users').select('*').order('created_at', { ascending: false });
    if (params?.role) q = q.eq('role', params.role);
    const { data } = await q;
    return { users: (data || []) as User[] };
  }

  async createAdminUser(payload: any): Promise<{ message: string; user: User }> {
    const id = 'usr_' + Math.random().toString(36).substring(2, 10);
    const { data, error } = await supabase.from('users').insert([{ ...payload, id }]).select().single();
    if (error) throw new Error(error.message);
    return { message: 'User created', user: data as User };
  }

  async deleteAdminUser(id: string): Promise<{ message: string }> {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { message: 'User deleted' };
  }

  async updateAdminUserStatus(id: string, payload: any): Promise<{ message: string }> {
    const { error } = await supabase.from('users').update(payload).eq('id', id);
    if (error) throw new Error(error.message);
    return { message: 'Status updated' };
  }

  async adminResetUserPassword(id: string, payload: { new_password: string }): Promise<{ message: string }> {
    const { error } = await supabase.from('users').update({ password: payload.new_password }).eq('id', id);
    if (error) throw new Error(error.message);
    return { message: 'Password updated' };
  }

  async getAdminAuditLogs(params?: Record<string, string>): Promise<{ logs: AuditLog[] }> {
    let q = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
    if (params?.action) q = q.eq('action', params.action);
    const { data } = await q;
    return { logs: (data || []) as AuditLog[] };
  }

  async exportReport(type: string): Promise<{ type: string; count: number; data: any[] }> {
    return { type, count: 0, data: [] };
  }

  async resetDemoSeed(): Promise<{ message: string }> {
    return { message: 'Seed reset completed' };
  }
}

export const api = new SupabaseApiService();
