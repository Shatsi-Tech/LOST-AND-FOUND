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

const API_BASE = '/api';

// Backend server base URL — used to resolve /uploads/ image paths
// In development, Vite proxies /uploads to localhost:5000 so an empty string works.
// In production builds the backend serves both the API and static files from the same origin.
const BACKEND_ORIGIN = '';

/**
 * Resolves a stored image_url (which may be a relative /uploads/... path)
 * to an absolute URL safe to use as an <img src>.
 */
export function getImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  // Already an absolute URL (http/https or data: URI) — return as-is
  if (/^(https?:|data:)/.test(imageUrl)) return imageUrl;
  // Relative path — prefix with backend origin
  return `${BACKEND_ORIGIN}${imageUrl}`;
}

class ApiService {
  private getHeaders(isFormData: boolean = false): HeadersInit {
    const headers: Record<string, string> = {};
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    const token = localStorage.getItem('unifind_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    const contentType = res.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const errorMsg = (data && data.error) || (data && data.message) || res.statusText || 'An unexpected error occurred';
      throw new Error(errorMsg);
    }

    return data as T;
  }

  // AUTH
  async register(payload: any): Promise<{ user: User; token: string; message: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse(res);
  }

  async login(payload: any): Promise<{ user: User; token: string; message: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse(res);
  }

  async getCurrentUser(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async resetPassword(payload: any): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse(res);
  }

  async demoSwitch(payload: { role?: string; email?: string }): Promise<{ user: User; token: string; message: string }> {
    const res = await fetch(`${API_BASE}/auth/demo-switch`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse(res);
  }

  async getDemoUsers(): Promise<{ users: User[] }> {
    const res = await fetch(`${API_BASE}/auth/demo-users`);
    return this.handleResponse(res);
  }

  // METADATA
  async getMeta(): Promise<{ categories: Category[]; locations: CampusLocation[] }> {
    const res = await fetch(`${API_BASE}/meta`);
    return this.handleResponse(res);
  }

  // IMAGE UPLOAD
  async uploadImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_BASE}/items/upload-image`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    return this.handleResponse(res);
  }

  // LOST ITEMS
  async reportLostItem(payload: any): Promise<{ item: LostItem; message: string }> {
    const res = await fetch(`${API_BASE}/items/lost`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse(res);
  }

  async getLostItems(params?: Record<string, string>): Promise<{ items: LostItem[] }> {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/items/lost?${query}`);
    return this.handleResponse(res);
  }

  async getLostItemDetails(id: string): Promise<{ item: LostItem; matches: ItemMatch[] }> {
    const res = await fetch(`${API_BASE}/items/lost/${id}`);
    return this.handleResponse(res);
  }

  async getMyLostItems(): Promise<{ items: LostItem[] }> {
    const res = await fetch(`${API_BASE}/items/my-lost`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async updateLostItemStatus(id: string, status: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/items/lost/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });
    return this.handleResponse(res);
  }

  // FOUND ITEMS
  async reportFoundItem(payload: any): Promise<{ item: FoundItem; message: string }> {
    const res = await fetch(`${API_BASE}/items/found`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse(res);
  }

  async getFoundItems(params?: Record<string, string>): Promise<{ items: FoundItem[] }> {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/items/found?${query}`);
    return this.handleResponse(res);
  }

  async getFoundItemDetails(id: string): Promise<{ item: FoundItem }> {
    const res = await fetch(`${API_BASE}/items/found/${id}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async getMyFoundItems(): Promise<{ items: FoundItem[] }> {
    const res = await fetch(`${API_BASE}/items/my-found`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async updateFoundItemStatus(id: string, payload: any): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/items/found/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse(res);
  }

  // CLAIMS
  async submitClaim(payload: any): Promise<{ claim: Claim; message: string }> {
    const res = await fetch(`${API_BASE}/claims`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse(res);
  }

  async getMyClaims(): Promise<{ claims: Claim[] }> {
    const res = await fetch(`${API_BASE}/claims/my-claims`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async getAllClaims(params?: Record<string, string>): Promise<{ claims: Claim[] }> {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/claims?${query}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async getClaimDetails(id: string): Promise<{ claim: Claim }> {
    const res = await fetch(`${API_BASE}/claims/${id}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async reviewClaim(id: string, payload: { status: string; rejection_reason?: string; admin_notes?: string }): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/claims/${id}/review`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse(res);
  }

  // HANDOVERS
  async lookupHandover(reference: string): Promise<{ claim: Claim; handover: Handover | null }> {
    const res = await fetch(`${API_BASE}/handovers/lookup?reference=${encodeURIComponent(reference)}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async completeHandover(payload: { claim_id: string; id_verified: boolean; notes?: string; signature_name?: string }): Promise<{ message: string; handover: Handover }> {
    const res = await fetch(`${API_BASE}/handovers`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse(res);
  }

  async getHandoverHistory(params?: Record<string, string>): Promise<{ handovers: Handover[] }> {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/handovers?${query}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  // NOTIFICATIONS
  async getNotifications(): Promise<{ notifications: NotificationItem[]; unread_count: number }> {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async getUnreadNotificationCount(): Promise<{ count: number }> {
    const res = await fetch(`${API_BASE}/notifications/unread-count`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async markNotificationRead(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async markAllNotificationsRead(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/notifications/mark-all-read`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async deleteNotification(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/notifications/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  // STATS
  async getPublicStats(): Promise<PublicStats> {
    const res = await fetch(`${API_BASE}/stats/public`);
    return this.handleResponse(res);
  }

  async getStudentSummary(userId: string): Promise<StudentDashboardSummary> {
    const res = await fetch(`${API_BASE}/stats/student-summary/${userId}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async getAdminAnalytics(): Promise<AdminAnalytics> {
    const res = await fetch(`${API_BASE}/stats/admin`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  // ADMIN OPERATIONS
  async getAdminCategories(): Promise<{ categories: Category[] }> {
    const res = await fetch(`${API_BASE}/admin/categories`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async createCategory(payload: any): Promise<{ message: string; id: string }> {
    const res = await fetch(`${API_BASE}/admin/categories`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse(res);
  }

  async updateCategory(id: string, payload: any): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/admin/categories/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse(res);
  }

  async getAdminLocations(): Promise<{ locations: CampusLocation[] }> {
    const res = await fetch(`${API_BASE}/admin/locations`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async createLocation(payload: any): Promise<{ message: string; id: string }> {
    const res = await fetch(`${API_BASE}/admin/locations`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse(res);
  }

  async updateLocation(id: string, payload: any): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/admin/locations/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse(res);
  }

  async getAdminUsers(params?: Record<string, string>): Promise<{ users: User[] }> {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/admin/users?${query}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async createAdminUser(payload: any): Promise<{ message: string; user: User }> {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse(res);
  }

  async deleteAdminUser(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async updateAdminUserStatus(id: string, payload: any): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse(res);
  }

  async adminResetUserPassword(id: string, payload: { new_password: string }): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/admin/users/${id}/reset-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse(res);
  }

  async getAdminAuditLogs(params?: Record<string, string>): Promise<{ logs: AuditLog[] }> {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/admin/audit-logs?${query}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async exportReport(type: string): Promise<{ type: string; count: number; data: any[] }> {
    const res = await fetch(`${API_BASE}/admin/export/${type}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async resetDemoSeed(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/seed/reset`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }
}

export const api = new ApiService();
