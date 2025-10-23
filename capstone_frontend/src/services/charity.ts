/**
 * Charity Service
 * 
 * Handles charity-specific API calls including donation channels
 */
import axios, { AxiosInstance } from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

class CharityService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Get all donation channels for a charity
  async getDonationChannels(charityId: number) {
    const res = await this.api.get(`/charities/${charityId}/channels`);
    return res.data;
  }

  // Get donation channel
  async getDonationChannel(channelId: number) {
    const res = await this.api.get(`/channels/${channelId}`);
    return res.data;
  }

  // Create new donation channel
  async createDonationChannel(
    charityId: number,
    payload: {
      type: 'gcash' | 'paymaya' | 'paypal' | 'bank' | 'other';
      label: string;
      details: Record<string, any>;
      qr_image?: File | null;
    }
  ) {
    const fd = new FormData();
    
    fd.append('type', payload.type);
    fd.append('label', payload.label);
    
    if (payload.details) {
      Object.entries(payload.details).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(`details[${k}]`, String(v));
      });
    }
    
    if (payload.qr_image) fd.append('qr_image', payload.qr_image);
    
    const res = await this.api.post(`/charities/${charityId}/channels`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  // Update existing donation channel
  async updateDonationChannel(
    channelId: number,
    payload: {
      type?: 'gcash' | 'paymaya' | 'paypal' | 'bank' | 'other';
      label?: string;
      details?: Record<string, any>;
      qr_image?: File | null;
      is_active?: boolean;
    }
  ) {
    const fd = new FormData();
    
    if (payload.type) fd.append('type', payload.type);
    if (payload.label) fd.append('label', payload.label);
    if (payload.is_active !== undefined) fd.append('is_active', String(payload.is_active));
    
    if (payload.details) {
      Object.entries(payload.details).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(`details[${k}]`, String(v));
      });
    }
    
    if (payload.qr_image) fd.append('qr_image', payload.qr_image);
    
    const res = await this.api.put(`/channels/${channelId}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  // Delete donation channel
  async deleteDonationChannel(channelId: number) {
    await this.api.delete(`/channels/${channelId}`);
  }

  // Get charity dashboard stats
  async getDashboardStats(charityId: number) {
    const res = await this.api.get(`/charities/${charityId}/dashboard-stats`);
    return res.data;
  }

  // Get recent donations for charity
  async getRecentDonations(charityId: number, limit: number = 5) {
    const res = await this.api.get(`/charities/${charityId}/donations`, {
      params: { limit, status: 'confirmed' }
    });
    return res.data;
  }

  // Get recent posts for charity
  async getRecentPosts(charityId: number, limit: number = 1) {
    const res = await this.api.get(`/charities/${charityId}/posts`, {
      params: { limit }
    });
    return res.data;
  }

  // Get active campaigns count
  async getActiveCampaigns(charityId: number) {
    const res = await this.api.get(`/charities/${charityId}/campaigns`, {
      params: { status: 'active' }
    });
    return res.data;
  }

  // Get pending donations count
  async getPendingDonationsCount(charityId: number) {
    const res = await this.api.get(`/charities/${charityId}/donations`, {
      params: { status: 'pending' }
    });
    return res.data;
  }

  // Get public charity profile
  async getPublicCharityProfile(charityId: number) {
    const res = await this.api.get(`/charities/${charityId}`);
    return res.data;
  }

  // Get charity campaigns (public)
  async getCharityCampaigns(charityId: number, params?: { status?: string; page?: number }) {
    const res = await this.api.get(`/charities/${charityId}/campaigns`, { params });
    return res.data;
  }

  // Follow/unfollow charity
  async toggleFollow(charityId: number) {
    const res = await this.api.post(`/charities/${charityId}/follow`);
    return res.data;
  }

  // Check if user follows charity
  async checkFollowStatus(charityId: number) {
    const res = await this.api.get(`/charities/${charityId}/follow-status`);
    return res.data;
  }

  // Get charity stats (public)
  async getCharityStats(charityId: number) {
    try {
      const res = await this.api.get(`/charities/${charityId}/stats`);
      return res.data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return {
          total_campaigns: 0,
          active_campaigns: 0,
          followers_count: 0,
          total_donations: 0,
        };
      }
      throw error;
    }
  }

  // Update charity profile (mission, vision, description, contacts, socials, etc.)
  async updateProfile(payload: Record<string, any>) {
    // Normalize website/social URLs to include scheme
    const normalizeUrl = (url?: string) => {
      if (!url) return url;
      return /^(https?:)?\/\//i.test(url) ? url : `https://${url}`;
    };
    const body: Record<string, any> = { ...payload };
    if (body.website) body.website = normalizeUrl(body.website);
    if (body.facebook_url) body.facebook_url = normalizeUrl(body.facebook_url);
    if (body.instagram_url) body.instagram_url = normalizeUrl(body.instagram_url);
    if (body.twitter_url) body.twitter_url = normalizeUrl(body.twitter_url);
    if (body.linkedin_url) body.linkedin_url = normalizeUrl(body.linkedin_url);
    if (body.youtube_url) body.youtube_url = normalizeUrl(body.youtube_url);

    const res = await this.api.post('/charity/profile/update', body);
    return res.data;
  }
}

// Export a single instance
export const charityService = new CharityService();
