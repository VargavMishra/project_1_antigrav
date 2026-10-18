import { Profile, ProfileUpdateInput, AuditLogEntry } from '../types/index.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage = data?.error?.message || `HTTP ${response.status}: Request failed`;
        const error = new Error(errorMessage) as any;
        error.code = data?.error?.code || 'API_ERROR';
        error.status = response.status;
        error.details = data?.error?.details;
        throw error;
      }

      return data;
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error(`Cannot connect to backend server at ${this.baseUrl}. Is the server running?`);
      }
      throw err;
    }
  }

  /**
   * Health Check: GET /api/health
   */
  async getHealth(): Promise<{ status: string; uptimeSeconds: number; services: any }> {
    return this.request<{ status: string; uptimeSeconds: number; services: any }>('/api/health');
  }

  /**
   * Get Current Authenticated Profile: GET /api/v1/profile/me
   */
  async getMyProfile(token: string): Promise<{ success: boolean; data: Profile }> {
    return this.request<{ success: boolean; data: Profile }>('/api/v1/profile/me', { method: 'GET' }, token);
  }

  /**
   * Update Profile: PATCH /api/v1/profile/me
   */
  async updateMyProfile(token: string, payload: ProfileUpdateInput): Promise<{ success: boolean; data: Profile; message: string }> {
    return this.request<{ success: boolean; data: Profile; message: string }>(
      '/api/v1/profile/me',
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      token
    );
  }

  /**
   * Update Avatar: POST /api/v1/profile/me/avatar
   */
  async updateAvatar(token: string, avatarUrl: string): Promise<{ success: boolean; data: Profile }> {
    return this.request<{ success: boolean; data: Profile }>(
      '/api/v1/profile/me/avatar',
      {
        method: 'POST',
        body: JSON.stringify({ avatar_url: avatarUrl }),
      },
      token
    );
  }

  /**
   * Get Audit Logs: GET /api/v1/profile/me/audit-logs
   */
  async getAuditLogs(token: string): Promise<{ success: boolean; data: AuditLogEntry[] }> {
    return this.request<{ success: boolean; data: AuditLogEntry[] }>('/api/v1/profile/me/audit-logs', { method: 'GET' }, token);
  }
}

export const api = new ApiClient(API_BASE_URL);
