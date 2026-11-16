import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getForecast, getAirQuality, searchCities } from './weather-api';

// Helper to read both data and timestamp from localStorage cache
function getCachedCacheItem<T>(key: string): { data: T; timestamp: number } | undefined {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      const parsed = JSON.parse(item);
      if (parsed && typeof parsed.data !== 'undefined') {
        return { data: parsed.data, timestamp: parsed.timestamp || 0 };
      }
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
  const cached = getCachedCacheItem<any>(cacheKey);

  return useQuery({
    queryKey: ['weather', lat, lon],
    queryFn: async () => {
      const data = await getForecast(lat!, lon!);
      setCachedData(cacheKey, data);
      return data;
    },
    enabled: lat !== undefined && lon !== undefined && !!isActive,
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.timestamp,
    refetchInterval: 15 * 60 * 1000, // Background poll every 15 minutes
    staleTime: 10 * 60 * 1000,      // Consider data fresh for 10 minutes (prevents spamming)
    gcTime: 24 * 60 * 60 * 1000,
    placeholderData: keepPreviousData,
    refetchOnMount: false,          // Prevents refetching just from mounting if within staleTime
    refetchOnWindowFocus: false,    // Prevents refetching when switching back to tab
    retry: 1,
    retryDelay: 5000,
  });
}

export function useAirQuality(lat: number | undefined, lon: number | undefined, isActive?: boolean) {
  const cacheKey = `atmos_aqi_${lat}__${lon}`;
  const cached = getCachedCacheItem<any>(cacheKey);

  return useQuery({
    queryKey: ['airQuality', lat, lon],
    queryFn: async () => {
      const data = await getAirQuality(lat!, lon!);
      setCachedData(cacheKey, data);
      return data;
    },
    enabled: lat !== undefined && lon !== undefined && !!isActive,
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.timestamp, // Tells TanStack Query the true age of the cache!
    refetchInterval: 30 * 60 * 1000,
    staleTime: 10 * 60 * 1000,
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