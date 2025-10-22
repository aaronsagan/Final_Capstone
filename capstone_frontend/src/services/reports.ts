import axios, { AxiosInstance, AxiosHeaders } from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error('VITE_API_URL is not defined in your environment');
}

export interface Report {
  id: number;
  reported_entity_type: 'user' | 'charity' | 'campaign' | 'donation';
  reported_entity_id: number;
  reason: string;
  description: string;
  evidence_path?: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  admin_notes?: string;
  reviewed_at?: string;
  action_taken?: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

class ReportsService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        Accept: 'application/json',
      },
    });

    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (token) {
        const headers = config.headers ?? new AxiosHeaders();
        headers.set('Authorization', `Bearer ${token}`);
        config.headers = headers;
      }
      return config;
    });
  }

  async getMyReports(): Promise<PaginatedResponse<Report>> {
    const res = await this.api.get<PaginatedResponse<Report>>('/me/reports');
    return res.data;
  }

  async submitReport(form: FormData): Promise<{ message: string; report: Report }> {
    const res = await this.api.post<{ message: string; report: Report }>(
      '/reports',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  }
}

export const reportsService = new ReportsService();
