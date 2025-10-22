/**
 * Updates Service
 * 
 * Handles all API calls for the Updates feature with threading
 */
import axios, { AxiosInstance } from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

class UpdatesService {
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

  // Get all updates for logged-in charity
  async getMyUpdates() {
    const res = await this.api.get('/updates');
    return res.data;
  }

  // Get updates for a specific charity (public)
  async getCharityUpdates(charityId: number) {
    const res = await this.api.get(`/charities/${charityId}/updates`);
    return res.data;
  }

  // Create new update
  async createUpdate(data: {
    content: string;
    parent_id?: number;
    media?: File[];
  }) {
    const formData = new FormData();
    formData.append('content', data.content);
    
    if (data.parent_id) {
      formData.append('parent_id', data.parent_id.toString());
    }
    
    if (data.media && data.media.length > 0) {
      data.media.forEach((file) => {
        formData.append('media[]', file);
      });
    }

    const res = await this.api.post('/updates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  // Update existing update
  async updateUpdate(id: number, content: string) {
    const res = await this.api.put(`/updates/${id}`, { content });
    return res.data;
  }

  // Delete update
  async deleteUpdate(id: number) {
    await this.api.delete(`/updates/${id}`);
  }

  // Toggle pin status
  async togglePin(id: number) {
    const res = await this.api.post(`/updates/${id}/pin`);
    return res.data;
  }

  // Toggle like
  async toggleLike(id: number) {
    const res = await this.api.post(`/updates/${id}/like`);
    return res.data;
  }

  // Get comments for an update
  async getComments(updateId: number) {
    const res = await this.api.get(`/updates/${updateId}/comments`);
    return res.data;
  }

  // Add comment
  async addComment(updateId: number, content: string) {
    const res = await this.api.post(`/updates/${updateId}/comments`, { content });
    return res.data;
  }

  // Update/Edit comment
  async updateComment(commentId: number, content: string) {
    const res = await this.api.put(`/comments/${commentId}`, { content });
    return res.data;
  }

  // Delete comment
  async deleteComment(commentId: number) {
    await this.api.delete(`/comments/${commentId}`);
  }

  // Hide/unhide comment (charity admin only)
  async hideComment(commentId: number) {
    const res = await this.api.patch(`/comments/${commentId}/hide`);
    return res.data;
  }
}

// Export a single instance
export const updatesService = new UpdatesService();
