import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getForecast, getAirQuality, searchCities } from './weather-api';

// Helper to read from localStorage cache
function getCachedData<T>(key: string): T | undefined {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      const parsed = JSON.parse(item);
      return parsed.data;
    }
  } catch (e) {
    // Ignore storage errors
  }
  return undefined;
}

// Helper to write to localStorage cache
function setCachedData<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    // Ignore storage errors
  }
}

export function useWeather(lat: number | undefined, lon: number | undefined, isActive?: boolean) {
  const cacheKey = `atmos_weather_${lat}__${lon}`;

  return useQuery({
    queryKey: ['weather', lat, lon],
    queryFn: async () => {
      const data = await getForecast(lat!, lon!);
      setCachedData(cacheKey, data);
      return data;
    },
    enabled: lat !== undefined && lon !== undefined && !!isActive,
    initialData: () => getCachedData(cacheKey), // Instantly hydrates from disk!
    refetchInterval: 15 * 60 * 1000,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: 5000,
  });
}

export function useAirQuality(lat: number | undefined, lon: number | undefined, isActive?: boolean) {
  const cacheKey = `atmos_aqi_${lat}__${lon}`;

  return useQuery({
    queryKey: ['airQuality', lat, lon],
    queryFn: async () => {
      const data = await getAirQuality(lat!, lon!);
      setCachedData(cacheKey, data);
      return data;
    },
    enabled: lat !== undefined && lon !== undefined && !!isActive,
    initialData: () => getCachedData(cacheKey), // Instantly hydrates from disk!
    refetchInterval: 30 * 60 * 1000,
    staleTime: 15 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useCitySearch(query: string) {
  return useQuery({
    queryKey: ['citySearch', query],
    queryFn: () => searchCities(query),
    enabled: query.trim().length >= 2,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}