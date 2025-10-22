/**
 * Storage URL Helper
 * 
 * Constructs correct URLs for accessing files stored in Laravel's public storage.
 * Laravel serves storage files at /storage/ (NOT /api/storage/)
 */

import { getBaseUrl, buildStorageUrl } from './api';

/**
 * Get the base storage URL (without /api prefix)
 * Laravel storage is served from the root, not through the API
 */
export function getStorageBaseUrl(): string {
  return getBaseUrl();
}

/**
 * Convert a storage path to a full URL
 * @param path - The storage path from the database (e.g., "charity_logos/abc123.jpg")
 * @returns Full URL to access the file (e.g., "http://127.0.0.1:8000/storage/charity_logos/abc123.jpg")
 */
export function getStorageUrl(path: string | null | undefined): string | null {
  return buildStorageUrl(path);
}

/**
 * Get logo URL for a charity
 */
export function getCharityLogoUrl(logoPath: string | null | undefined): string | null {
  return getStorageUrl(logoPath);
}

/**
 * Get cover image URL for a charity
 */
export function getCharityCoverUrl(coverPath: string | null | undefined): string | null {
  return getStorageUrl(coverPath);
}

/**
 * Get campaign cover image URL
 */
export function getCampaignCoverUrl(coverPath: string | null | undefined): string | null {
  return getStorageUrl(coverPath);
}

/**
 * Get profile image URL for a user
 */
export function getProfileImageUrl(imagePath: string | null | undefined): string | null {
  return getStorageUrl(imagePath);
}
