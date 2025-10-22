import { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '@/lib/api';

const API_URL = getApiUrl();

interface Region {
  code: string;
  name: string;
}

interface Province {
  code: string;
  name: string;
}

interface LocationData {
  regions: Region[];
  provinces: Province[];
  cities: string[];
}

export function usePhilippineLocations() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load regions on mount
  useEffect(() => {
    console.log('API_URL:', API_URL);
    console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
    loadRegions();
  }, []);

  const loadRegions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/locations/regions`);
      setRegions(response.data.regions || []);
    } catch (error) {
      console.error('Failed to load regions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProvinces = async (regionCode: string) => {
    if (!regionCode) {
      setProvinces([]);
      setCities([]);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/locations/regions/${regionCode}/provinces`);
      setProvinces(response.data.provinces || []);
      setCities([]); // Reset cities when region changes
    } catch (error) {
      console.error('Failed to load provinces:', error);
      setProvinces([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCities = async (regionCode: string, provinceCode: string) => {
    if (!regionCode || !provinceCode) {
      setCities([]);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/locations/regions/${regionCode}/provinces/${provinceCode}/cities`
      );
      setCities(response.data.cities || []);
    } catch (error) {
      console.error('Failed to load cities:', error);
      setCities([]);
    } finally {
      setLoading(false);
    }
  };

  const buildFullAddress = (
    streetAddress: string,
    barangay: string,
    city: string,
    province: string,
    region: string
  ): string => {
    const parts = [
      streetAddress,
      barangay,
      city,
      province,
      region
    ].filter(part => part && part.trim() !== '');

    return parts.join(', ');
  };

  return {
    regions,
    provinces,
    cities,
    loading,
    loadProvinces,
    loadCities,
    buildFullAddress,
  };
}
