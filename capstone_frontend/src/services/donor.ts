/**
 * Donor Service
 * 
 * Handles donor-specific API calls including dashboard stats, updates, and campaigns
 */
import axios, { AxiosInstance } from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export interface DonorStats {
  total_donated: number;
  charities_supported: number;
  donations_made: number;
  first_donation_date?: string;
  latest_donation_date?: string;
}

export interface CharityUpdate {
  id: number;
  charity_id: number;
  content: string;
  media_urls: string[];
  created_at: string;
  is_pinned: boolean;
  likes_count: number;
  comments_count: number;
  charity?: {
    id: number;
    name: string;
    logo_path?: string;
  };
}

export interface SuggestedCampaign {
  id: number;
  charity_id: number;
  title: string;
  description?: string;
  target_amount?: number;
  current_amount?: number;
  deadline_at?: string;
  cover_image_path?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  charity?: {
    id: number;
    name: string;
    logo_path?: string;
  };
}

class DonorService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Accept': 'application/json',
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

  /**
   * Get donor dashboard statistics
   */
  async getDashboardStats(): Promise<DonorStats> {
    // Fetch donations and calculate stats from them
    const res = await this.api.get('/me/donations');
    const donations = res.data.data || res.data;
    
    // Calculate stats from donations
    const completedDonations = donations.filter((d: any) => d.status === 'completed');
    const total_donated = completedDonations.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);
    const charities_supported = new Set(donations.map((d: any) => d.charity_id)).size;
    const donations_made = donations.length;
    
    // Get first and latest donation dates
    const sortedDonations = [...donations].sort((a: any, b: any) => 
      new Date(a.donated_at || a.created_at).getTime() - new Date(b.donated_at || b.created_at).getTime()
    );
    
    const first_donation_date = sortedDonations[0]?.donated_at || sortedDonations[0]?.created_at;
    const latest_donation_date = sortedDonations[sortedDonations.length - 1]?.donated_at || 
                                  sortedDonations[sortedDonations.length - 1]?.created_at;
    
    return {
      total_donated,
      charities_supported,
      donations_made,
      first_donation_date,
      latest_donation_date
    };
  }

  /**
   * Get updates from charities the donor has supported
   */
  async getSupportedCharitiesUpdates(limit: number = 4): Promise<CharityUpdate[]> {
    try {
      // Get all charities and fetch their updates
      const charitiesRes = await this.api.get('/charities');
      const charities = charitiesRes.data.charities?.data || charitiesRes.data.data || charitiesRes.data;
      
      if (!charities || charities.length === 0) {
        return [];
      }
      
      const allUpdates: CharityUpdate[] = [];
      
      // Fetch updates from first few charities
      for (const charity of charities.slice(0, 3)) {
        try {
          const updatesRes = await this.api.get(`/charities/${charity.id}/updates`, {
            validateStatus: (status) => {
              // Accept any status code to prevent axios from throwing errors
              return status >= 200 && status < 600;
            }
          });
          
          // Only process if request was successful
          if (updatesRes.status === 200) {
            const updates = updatesRes.data.data || updatesRes.data;
            
            if (updates && Array.isArray(updates)) {
              const updatesWithCharity = updates.map((u: any) => ({
                ...u,
                charity: {
                  id: charity.id,
                  name: charity.name,
                  logo_path: charity.logo_path
                }
              }));
              allUpdates.push(...updatesWithCharity);
            }
          }
        } catch (error) {
          // Silently skip charities without updates or with errors
          // This is expected behavior - not all charities have updates
        }
      }
      
      // Return most recent updates
      return allUpdates
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
        
    } catch (error) {
      console.error('Failed to fetch updates:', error);
      return [];
    }
  }

  /**
   * Get suggested campaigns for the donor
   */
  async getSuggestedCampaigns(limit: number = 3): Promise<SuggestedCampaign[]> {
    try {
      // First, get all charities
      const charitiesRes = await this.api.get('/charities');
      const charities = charitiesRes.data.charities?.data || charitiesRes.data.data || charitiesRes.data;
      
      if (!charities || charities.length === 0) {
        return [];
      }
      
      // Fetch campaigns from all charities
      const allCampaigns: SuggestedCampaign[] = [];
      
      for (const charity of charities.slice(0, 5)) { // Limit to first 5 charities to avoid too many requests
        try {
          const campaignsRes = await this.api.get(`/charities/${charity.id}/campaigns`, {
            validateStatus: (status) => {
              // Accept any status code to prevent axios from throwing errors
              return status >= 200 && status < 600;
            }
          });
          
          // Only process if request was successful
          if (campaignsRes.status === 200) {
            const campaigns = campaignsRes.data.data || campaignsRes.data;
            
            if (campaigns && Array.isArray(campaigns)) {
              // Add charity info to each campaign and filter published ones
              const publishedCampaigns = campaigns
                .filter((c: any) => c.status === 'published')
                .map((c: any) => ({
                  ...c,
                  charity: {
                    id: charity.id,
                    name: charity.name,
                    logo_path: charity.logo_path
                  }
                }));
              
              allCampaigns.push(...publishedCampaigns);
            }
          }
        } catch (error) {
          // Silently skip charities without campaigns or with errors
          // This is expected behavior - not all charities have campaigns
        }
      }
      
      // Return limited number of campaigns, sorted by most recent
      return allCampaigns
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        .slice(0, limit);
        
    } catch (error) {
      console.error('Failed to fetch suggested campaigns:', error);
      return [];
    }
  }

  /**
   * Get all charities (for browsing)
   */
  async getAllCharities(page: number = 1) {
    const res = await this.api.get('/charities', {
      params: { page }
    });
    return res.data;
  }

  /**
   * Get all campaigns (for discovery)
   */
  async getAllCampaigns(page: number = 1, filters?: any) {
    const res = await this.api.get('/campaigns', {
      params: { page, ...filters }
    });
    return res.data;
  }
}

// Export a single instance
export const donorService = new DonorService();
