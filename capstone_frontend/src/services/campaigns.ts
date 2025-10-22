/**
 * Campaign Service
 * 
 * Handles all campaign-related API calls for creating, managing, and viewing campaigns.
 */
import axios, { AxiosInstance } from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error('VITE_API_URL is not defined in your .env.local file');
}

// --- Types ---
export interface Campaign {
  id: number;
  charity_id: number;
  title: string;
  description?: string;
  problem?: string;
  solution?: string;
  outcome?: string;
  target_amount?: number;
  current_amount?: number;
  deadline_at?: string;
  cover_image_path?: string;
  status: 'draft' | 'published' | 'closed' | 'archived';
  donation_type: 'one_time' | 'recurring';
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  charity?: {
    id: number;
    name: string;
    logo_path?: string;
  };
}

export interface CampaignFormData {
  title: string;
  description?: string;
  problem?: string;
  solution?: string;
  outcome?: string;
  target_amount?: number;
  deadline_at?: string;
  status?: 'draft' | 'published' | 'closed' | 'archived';
  donation_type: 'one_time' | 'recurring';
  start_date?: string;
  end_date?: string;
  cover_image?: File;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// --- Campaign Service Class ---
class CampaignService {
  private apiClient: AxiosInstance;

  constructor() {
    this.apiClient = axios.create({
      baseURL: API_URL,
      headers: {
        'Accept': 'application/json',
      },
    });

    // Interceptor to add auth token
    this.apiClient.interceptors.request.use((config) => {
      const token = this.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // --- Token Management ---
  private getToken(): string | null {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  // --- Campaign CRUD Operations ---
  
  /**
   * Get all campaigns for a specific charity
   */
  async getCampaigns(charityId: number, page: number = 1): Promise<PaginatedResponse<Campaign>> {
    const response = await this.apiClient.get<PaginatedResponse<Campaign>>(
      `/charities/${charityId}/campaigns`,
      { params: { page } }
    );
    return response.data;
  }

  /**
   * Get a single campaign by ID
   */
  async getCampaign(campaignId: number): Promise<Campaign> {
    const response = await this.apiClient.get<Campaign>(`/campaigns/${campaignId}`);
    return response.data;
  }

  /**
   * Create a new campaign
   */
  async createCampaign(charityId: number, data: CampaignFormData): Promise<{ message: string; campaign: Campaign }> {
    const formData = new FormData();
    
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.problem) formData.append('problem', data.problem);
    if (data.solution) formData.append('solution', data.solution);
    if (data.outcome) formData.append('outcome', data.outcome);
    if (data.target_amount) formData.append('target_amount', data.target_amount.toString());
    if (data.deadline_at) formData.append('deadline_at', data.deadline_at);
    if (data.status) formData.append('status', data.status);
    formData.append('donation_type', data.donation_type);
    if (data.start_date) formData.append('start_date', data.start_date);
    if (data.end_date) formData.append('end_date', data.end_date);
    if (data.cover_image) formData.append('cover_image', data.cover_image);

    const response = await this.apiClient.post<{ message: string; campaign: Campaign }>(
      `/charities/${charityId}/campaigns`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  }

  /**
   * Update an existing campaign
   */
  async updateCampaign(campaignId: number, data: Partial<CampaignFormData>): Promise<Campaign> {
    const formData = new FormData();
    
    if (data.title) formData.append('title', data.title);
    if (data.description !== undefined) formData.append('description', data.description);
    if (data.problem !== undefined) formData.append('problem', data.problem);
    if (data.solution !== undefined) formData.append('solution', data.solution);
    if (data.outcome !== undefined) formData.append('outcome', data.outcome);
    if (data.target_amount !== undefined) formData.append('target_amount', data.target_amount.toString());
    if (data.deadline_at !== undefined) formData.append('deadline_at', data.deadline_at);
    if (data.status) formData.append('status', data.status);
    if (data.donation_type) formData.append('donation_type', data.donation_type);
    if (data.start_date !== undefined) formData.append('start_date', data.start_date);
    if (data.end_date !== undefined) formData.append('end_date', data.end_date);
    if (data.cover_image) formData.append('cover_image', data.cover_image);

    // Laravel requires _method for file uploads with PUT/PATCH
    formData.append('_method', 'PUT');

    const response = await this.apiClient.post<Campaign>(
      `/campaigns/${campaignId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(campaignId: number): Promise<void> {
    await this.apiClient.delete(`/campaigns/${campaignId}`);
  }

  /**
   * Get campaign updates/posts
   */
  async getCampaignUpdates(campaignId: number): Promise<any[]> {
    const response = await this.apiClient.get(`/campaigns/${campaignId}/updates`);
    return response.data.data || response.data;
  }

  /**
   * Get campaign supporters/donors
   */
  async getCampaignSupporters(campaignId: number): Promise<any[]> {
    const response = await this.apiClient.get(`/campaigns/${campaignId}/supporters`);
    return response.data.data || response.data;
  }

  /**
   * Get campaign donations
   */
  async getCampaignDonations(campaignId: number, page: number = 1): Promise<PaginatedResponse<any>> {
    const response = await this.apiClient.get(
      `/campaigns/${campaignId}/donations`,
      { params: { page } }
    );
    return response.data;
  }

  /**
   * Get campaign fund usage/breakdown
   */
  async getCampaignFundUsage(campaignId: number): Promise<any[]> {
    const response = await this.apiClient.get(`/campaigns/${campaignId}/fund-usage`);
    return response.data.data || response.data;
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(campaignId: number): Promise<any> {
    const response = await this.apiClient.get(`/campaigns/${campaignId}/stats`);
    return response.data;
  }
}

// Export singleton instance
export const campaignService = new CampaignService();
