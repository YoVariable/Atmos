import { useQuery } from '@tanstack/react-query';
import { getForecast, getAirQuality, searchCities } from './weather-api';

export function useWeather(lat: number | undefined, lon: number | undefined) {
  return useQuery({
    queryKey: ['weather', lat, lon],
    queryFn: () => getForecast(lat!, lon!),
    enabled: lat !== undefined && lon !== undefined,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useAirQuality(lat: number | undefined, lon: number | undefined) {
  return useQuery({
    queryKey: ['airQuality', lat, lon],
    queryFn: () => getAirQuality(lat!, lon!),
    enabled: lat !== undefined && lon !== undefined,
    refetchInterval: 15 * 60 * 1000,
  });
}

export function useCitySearch(query: string) {
  return useQuery({
    queryKey: ['citySearch', query],
    queryFn: () => searchCities(query),
    enabled: query.trim().length >= 2,
  });
}
