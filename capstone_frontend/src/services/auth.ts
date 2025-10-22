/**
 * Authentication Service
 *
 * Handles all authentication-related API calls.
 * This service is adapted to use token-based authentication.
 */
import axios, { AxiosInstance } from 'axios';

// Get the base URL from environment variables.
// Note: We are using VITE_API_URL to match the .env.local file we created earlier.
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error('VITE_API_URL is not defined in your .env.local file');
}

// --- Define Types for our data ---
interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'donor' | 'charity_admin' | 'admin';
  [key: string]: any;
}

export interface AuthResponse {
  token?: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface DonorRegistrationData {
  full_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  address?: string;
  preferred_contact_method?: 'email' | 'sms';
  anonymous_giving?: boolean;
  accept_terms: boolean;
}

export interface CharityRegistrationData {
  organization_name: string;
  legal_trading_name?: string;
  registration_number: string;
  tax_id: string;
  website?: string;
  contact_person_name: string;
  contact_email: string;
  contact_phone: string;
  password: string;
  password_confirmation: string;
  address: string;
  region: string;
  municipality: string;
  nonprofit_category: string;
  mission_statement: string;
  description: string;
  accept_terms: boolean;
  confirm_truthfulness: boolean;
}

// --- Create a reusable AuthService class ---
class AuthService {
  private apiClient: AxiosInstance;

  constructor() {
    this.apiClient = axios.create({
      baseURL: API_URL,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // Interceptor to automatically add the auth token to requests
    this.apiClient.interceptors.request.use((config) => {
      const token = this.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // --- Core API Methods ---

  /**
   * Login with email and password.
   * Your backend should return a token and user object.
   */
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await this.apiClient.post<AuthResponse>('/auth/login', credentials);
    
    if (response.data.token) {
      this.setToken(response.data.token, credentials.remember_me);
    }

    return response.data.user;
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    const response = await this.apiClient.get<User>('/me');
    return response.data;
  }

  /**
   * Save donor registration draft (step-by-step partial data)
   */
  async saveDonorDraft(payload: Record<string, any>): Promise<{ success: boolean }> {
    try {
      const response = await this.apiClient.post('/donors/register/draft', payload);
      return response.data;
    } catch (e: any) {
      // Graceful no-op if endpoint not present
      if (e?.response?.status === 404 || e?.code === 'ERR_NETWORK') {
        console.warn('saveDonorDraft endpoint not available, skipping server draft save');
        return { success: false };
      }
      throw e;
    }
  }

  /**
   * Upload donor identity verification files (ID and optional selfie)
   */
  async uploadDonorVerification(formData: FormData): Promise<{ success: boolean }> {
    try {
      const response = await this.apiClient.post('/donors/register/verification', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (e: any) {
      if (e?.response?.status === 404 || e?.code === 'ERR_NETWORK') {
        console.warn('uploadDonorVerification endpoint not available, will include files in final submission');
        return { success: false };
      }
      throw e;
    }
  }

  /**
   * Final donor registration submission (all fields)
   */
  async submitDonorRegistration(formData: FormData): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.apiClient.post('/donors/register/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (e: any) {
      const status = e?.response?.status;
      // Fallback to legacy donor registration endpoint
      if (status === 404 || status === 405 || status === 501) {
        // Map new fields to legacy /auth/register API
        const first = (formData.get('first_name') as string) || '';
        const middle = (formData.get('middle_name') as string) || '';
        const last = (formData.get('last_name') as string) || '';
        const email = (formData.get('email') as string) || '';
        const phone = (formData.get('phone') as string) || '';
        const fullAddress = (formData.get('full_address') as string) || (formData.get('street_address') as string) || '';
        const password = (formData.get('password') as string) || '';
        const passwordConfirmation = (formData.get('password_confirmation') as string) || '';
        const profileImage = formData.get('profile_image') as File | null;

        const legacy = new FormData();
        const name = [first, middle, last].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
        legacy.append('name', name || email.split('@')[0] || 'Donor');
        legacy.append('email', email);
        legacy.append('password', password);
        legacy.append('password_confirmation', passwordConfirmation);
        if (phone) legacy.append('phone', phone);
        if (fullAddress) legacy.append('address', fullAddress);
        if (profileImage) legacy.append('profile_image', profileImage);

        const response = await this.apiClient.post('/auth/register', legacy, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
      }
      throw e;
    }
  }

  /**
   * Logout the current user.
   */
  async logout(): Promise<void> {
    try {
      await this.apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
    this.clearToken();
  }

  /**
   * Register a new donor.
   */
  async registerDonor(data: any): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('name', data.full_name);
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('password_confirmation', data.password_confirmation);
    if (data.phone) formData.append('phone', data.phone);
    if (data.address) formData.append('address', data.address);
    if (data.profile_image) formData.append('profile_image', data.profile_image);
    
    const response = await this.apiClient.post<AuthResponse>('/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  /**
   * Register a new charity.
   */
  async registerCharity(data: any): Promise<{ success: boolean, message: string }> {
    // If data is already FormData, use it directly
    if (data instanceof FormData) {
      const response = await this.apiClient.post('/auth/register-charity', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return { success: true, message: response.data.message };
    }
    
    // Otherwise, create FormData from object
    const formData = new FormData();
    
    // Representative details
    formData.append('name', data.contact_person_name);
    formData.append('email', data.contact_email);
    formData.append('password', data.password || 'TempPassword123!');
    formData.append('password_confirmation', data.password_confirmation || 'TempPassword123!');
    if (data.contact_phone) formData.append('phone', data.contact_phone);
    
    // Organization details
    formData.append('charity_name', data.organization_name);
    if (data.registration_number) formData.append('reg_no', data.registration_number);
    if (data.tax_id) formData.append('tax_id', data.tax_id);
    if (data.mission_statement) formData.append('mission', data.mission_statement);
    if (data.description) formData.append('vision', data.description);
    if (data.website) formData.append('website', data.website);
    formData.append('contact_email', data.contact_email);
    if (data.contact_phone) formData.append('contact_phone', data.contact_phone);
    if (data.address) formData.append('address', data.address);
    
    const response = await this.apiClient.post('/auth/register-charity', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    return { success: true, message: response.data.message };
  }

  // --- Token Management ---
  private tokenKey = 'auth_token';

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey) || sessionStorage.getItem(this.tokenKey);
  }

  setToken(token: string, remember: boolean = false): void {
    if (remember) {
      localStorage.setItem(this.tokenKey, token);
    } else {
      sessionStorage.setItem(this.tokenKey, token);
    }
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

// Export a single instance of the service
export const authService = new AuthService();

