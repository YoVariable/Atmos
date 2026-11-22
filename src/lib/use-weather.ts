import { useQuery } from '@tanstack/react-query';
import { getForecast, getAirQuality, searchCities } from './weather-api';

// Helper to read both data and timestamp from localStorage cache
function getCachedCacheItem<T>(
  key: string,
  maxAgeMs = Infinity
): { data: T; timestamp: number } | undefined {
  try {
    const item = localStorage.getItem(key);
    if (!item) return undefined;

    const parsed = JSON.parse(item);

    if (!parsed || typeof parsed.data === 'undefined') {
      return undefined;
    }

    const timestamp = parsed.timestamp;

    if (
      typeof timestamp !== 'number' ||
      !Number.isFinite(timestamp) ||
      timestamp <= 0
    ) {
      return undefined;
    }

    const age = Date.now() - timestamp;

    // Reject future timestamps and excessively old data.
    if (age < 0 || age > maxAgeMs) {
      return undefined;
    }

    return { data: parsed.data as T, timestamp };
  } catch {
    return undefined;
  }
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
  const cached = getCachedCacheItem<any>(
  cacheKey,
  24 * 60 * 60 * 1000 // Maximum 24-hour forecast cache
);

  return useQuery({
    queryKey: ['weather', lat, lon],
    queryFn: async ({ signal }) => {
      const data = await getForecast(lat!, lon!, signal);
      setCachedData(cacheKey, data);
      return data;
    },
    enabled: lat !== undefined && lon !== undefined && !!isActive,
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.timestamp,
    refetchInterval: 15 * 60 * 1000, // Background poll every 15 minutes
    staleTime: 10 * 60 * 1000,      // Consider data fresh for 10 minutes (prevents spamming)
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnMount: true, // Refresh on mount only when cached data is stale
    refetchOnWindowFocus: false,    // Prevents refetching when switching back to tab
    retry: false, // Avoid repeated requests when Open-Meteo is unavailable
  });
}

export function useAirQuality(lat: number | undefined, lon: number | undefined, isActive?: boolean) {
  const cacheKey = `atmos_aqi_${lat}__${lon}`;
  const cached = getCachedCacheItem<any>(cacheKey);

  return useQuery({
    queryKey: ['airQuality', lat, lon],
    queryFn: async ({ signal }) => {
      const data = await getAirQuality(lat!, lon!, signal);
      setCachedData(cacheKey, data);
      return data;
    },
    enabled: lat !== undefined && lon !== undefined && !!isActive,
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.timestamp, // Tells TanStack Query the true age of the cache!
    refetchInterval: 30 * 60 * 1000,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false, // Avoid repeated requests when Open-Meteo is unavailable
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