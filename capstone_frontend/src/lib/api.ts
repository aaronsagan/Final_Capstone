/**
 * Centralized API Configuration
 * 
 * This file provides a single source of truth for API URLs and configurations.
 * All API calls should use these utilities to ensure consistency.
 */

/**
 * Get the base API URL from environment variables
 * @returns The base API URL (e.g., "http://127.0.0.1:8000/api")
 */
export function getApiUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (!apiUrl) {
    console.error('VITE_API_URL is not defined in your .env file');
    throw new Error('API URL is not configured');
  }
  
  return apiUrl;
}

/**
 * Get the base URL (without /api) for storage and other non-API resources
 * @returns The base URL (e.g., "http://127.0.0.1:8000")
 */
export function getBaseUrl(): string {
  const apiUrl = getApiUrl();
  // Remove /api from the end if it exists
  return apiUrl.replace(/\/api$/, '');
}

/**
 * Get the storage base URL
 * @returns The storage base URL (e.g., "http://127.0.0.1:8000/storage")
 */
export function getStorageUrl(): string {
  return `${getBaseUrl()}/storage`;
}

/**
 * Build a full API endpoint URL
 * @param endpoint - The API endpoint (e.g., "/charities/1/campaigns")
 * @returns Full API URL
 */
export function buildApiUrl(endpoint: string): string {
  const apiUrl = getApiUrl();
  // Remove leading slash from endpoint if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${apiUrl}/${cleanEndpoint}`;
}

/**
 * Build a full storage URL for a file path
 * @param path - The storage path from database (e.g., "charity_logos/abc123.jpg")
 * @returns Full storage URL or null if path is empty
 */
export function buildStorageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // If path already starts with 'storage/', don't add it again
  if (cleanPath.startsWith('storage/')) {
    return `${getBaseUrl()}/${cleanPath}`;
  }
  
  return `${getStorageUrl()}/${cleanPath}`;
}

/**
 * Get auth token from storage
 * @returns The auth token or null
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
}

/**
 * Create headers for API requests with auth token
 * @param additionalHeaders - Additional headers to include
 * @returns Headers object
 */
export function createAuthHeaders(additionalHeaders: Record<string, string> = {}): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Create headers for multipart form data requests with auth token
 * @returns Headers object (without Content-Type, let browser set it)
 */
export function createMultipartHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}
