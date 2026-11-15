import { useQuery } from '@tanstack/react-query';
import { getForecast, getAirQuality, searchCities } from './weather-api';

export function useWeather(lat: number | undefined, lon: number | undefined, isActive: boolean = true) {
  return useQuery({
    queryKey: ['weather', lat, lon],
    queryFn: () => getForecast(lat!, lon!),
    enabled: lat !== undefined && lon !== undefined && isActive, // Only fetch when active!
    refetchInterval: 15 * 60 * 1000,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: 5000,
  });
}

export function useAirQuality(lat: number | undefined, lon: number | undefined, isActive: boolean = true) {
  return useQuery({
    queryKey: ['airQuality', lat, lon],
    queryFn: () => getAirQuality(lat!, lon!),
    enabled: lat !== undefined && lon !== undefined && isActive, // Only fetch when active!
    refetchInterval: 30 * 60 * 1000,
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useCitySearch(query: string) {
  return useQuery({
    queryKey: ['citySearch', query],
    queryFn: () => searchCities(query),
    enabled: query.trim().length >= 2,
    staleTime: 60 * 1000, // Cache search results for 1 minute
    refetchOnWindowFocus: false,
  });
}