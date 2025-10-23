/**
 * Charity API Service
 *
 * Handles charity-related API calls including campaigns, fund usage, etc.
 */
import axios from 'axios';
import { campaignService } from './campaigns';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error('VITE_API_URL is not defined in your .env.local file');
}

// Types for charity operations
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ListCampaignsParams {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ListFundUsageParams {
  page?: number;
  pageSize?: number;
  category?: string;
}

// Campaign functions
export async function listCampaigns(params: ListCampaignsParams = {}): Promise<PaginatedResponse<any>> {
  // For now, return mock data since we need backend implementation
  // In a real implementation, this would call the charity campaigns API
  return {
    data: [],
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  };
}

export async function getCampaign(campaignId: string): Promise<any> {
  // Use the campaign service to get campaign details
  const response = await campaignService.getCampaign(parseInt(campaignId));
  return response;
}

export async function pauseCampaign(campaignId: string): Promise<void> {
  // Pause campaign - update status
  console.log(`Pausing campaign ${campaignId}`);
  // TODO: Implement actual API call when backend is ready
}

export async function resumeCampaign(campaignId: string): Promise<void> {
  // Resume campaign - update status
  console.log(`Resuming campaign ${campaignId}`);
  // TODO: Implement actual API call when backend is ready
}

export async function closeCampaign(campaignId: string): Promise<void> {
  // Close campaign - update status
  console.log(`Closing campaign ${campaignId}`);
  // TODO: Implement actual API call when backend is ready
}

export async function deleteCampaign(campaignId: string): Promise<void> {
  // For now, this is a mock implementation
  // In a real implementation, this would call the delete campaign API
  console.log(`Deleting campaign ${campaignId}`);
}

// Fund usage functions
export async function listFundUsage(params: ListFundUsageParams = {}): Promise<{
  data: any[];
  pagination: PaginatedResponse<any>;
}> {
  // For now, return mock data since we need backend implementation
  return {
    data: [],
    pagination: {
      data: [],
      current_page: 1,
      last_page: 1,
      per_page: 20,
      total: 0,
    }
  };
}

export async function createFundUsage(data: FormData): Promise<void> {
  // For now, this is a mock implementation
  // In a real implementation, this would call the create fund usage API
  console.log('Creating fund usage entry:', data);
}

export { campaignService };
