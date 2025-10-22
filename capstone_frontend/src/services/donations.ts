/**
 * Donations Service
 * 
 * Handles all donation-related API calls for charities and donors.
 */
import axios, { AxiosInstance } from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error('VITE_API_URL is not defined in your .env.local file');
}

// --- Types ---
export interface Donation {
  id: number;
  donor_id?: number;
  charity_id: number;
  campaign_id?: number;
  amount: number;
  purpose: 'general' | 'project' | 'emergency';
  is_anonymous: boolean;
  is_recurring: boolean;
  recurring_type?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  recurring_end_date?: string;
  next_donation_date?: string;
  status: 'pending' | 'completed' | 'rejected' | 'scheduled';
  proof_path?: string;
  proof_type?: string;
  external_ref?: string;
  receipt_no?: string;
  donated_at: string;
  created_at: string;
  updated_at: string;
  donor?: {
    id: number;
    name: string;
    email: string;
  };
  charity?: {
    id: number;
    name: string;
    logo_path?: string;
  };
  campaign?: {
    id: number;
    title: string;
  };
}

export interface DonationFormData {
  charity_id: number;
  campaign_id?: number;
  amount: number;
  purpose?: 'general' | 'project' | 'emergency';
  is_anonymous?: boolean;
  is_recurring?: boolean;
  recurring_type?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  recurring_end_date?: string;
  external_ref?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// --- Donations Service Class ---
class DonationsService {
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

  // --- Charity Operations ---
  
  /**
   * Get all donations for a specific charity (Charity Inbox)
   */
  async getCharityDonations(charityId: number, page: number = 1): Promise<PaginatedResponse<Donation>> {
    const response = await this.apiClient.get<PaginatedResponse<Donation>>(
      `/charities/${charityId}/donations`,
      { params: { page } }
    );
    return response.data;
  }

  /**
   * Confirm or reject a donation
   */
  async confirmDonation(
    donationId: number, 
    status: 'completed' | 'rejected'
  ): Promise<Donation> {
    const response = await this.apiClient.patch<Donation>(
      `/donations/${donationId}/confirm`,
      { status }
    );
    return response.data;
  }

  /**
   * Update donation status with optional reason
   */
  async updateDonationStatus(
    donationId: number,
    status: 'completed' | 'rejected' | 'pending',
    reason?: string
  ): Promise<Donation> {
    const response = await this.apiClient.patch<Donation>(
      `/donations/${donationId}/status`,
      { status, reason }
    );
    return response.data;
  }

  // --- Donor Operations ---
  
  /**
   * Create a new donation (Donor makes a donation)
   */
  async createDonation(data: DonationFormData): Promise<Donation> {
    const response = await this.apiClient.post<Donation>('/donations', data);
    return response.data;
  }

  /**
   * Upload proof of payment for a donation
   */
  async uploadProof(donationId: number, file: File, proofType?: string): Promise<Donation> {
    const formData = new FormData();
    formData.append('file', file);
    if (proofType) formData.append('proof_type', proofType);

    const response = await this.apiClient.post<Donation>(
      `/donations/${donationId}/proof`,
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
   * Get my donations (for donor)
   */
  async getMyDonations(page: number = 1): Promise<PaginatedResponse<Donation>> {
    const response = await this.apiClient.get<PaginatedResponse<Donation>>(
      '/me/donations',
      { params: { page } }
    );
    return response.data;
  }

  /**
   * Download receipt for a donation
   */
  async downloadReceipt(donationId: number): Promise<Blob> {
    const response = await this.apiClient.get(
      `/donations/${donationId}/receipt`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  }
}

// Export singleton instance
export const donationsService = new DonationsService();
