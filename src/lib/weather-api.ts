/**
 * Thin client for the Open-Meteo public APIs (no API key required, CORS-open).
 * All requests explicitly force metric units. Temperature is always requested
 * in Celsius from the API and MUST be converted to Felsius (see units.ts)
 * before being shown anywhere in the UI.
 */

export interface GeocodeResult {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface CurrentWeather {
  time: string; // ISO, local to the location's timezone
  temperature_2m: number; // Celsius
  apparent_temperature: number; // Celsius
  relative_humidity_2m: number; // %
  dew_point_2m: number; // Celsius
  precipitation: number; // mm
  weather_code: number;
  wind_speed_10m: number; // km/h
  wind_gusts_10m: number; // km/h
  wind_direction_10m: number; // degrees
  pressure_msl: number; // hPa
  visibility: number; // meters
  is_day: number; // 0 | 1
  uv_index?: number;
}

export interface HourlyForecast {
  time: string[];
  temperature_2m: number[]; // Celsius
  apparent_temperature: number[]; // Celsius
  precipitation_probability: number[]; // %
  weather_code: number[];
  is_day?: number[]; // 1 = day, 0 = night (optional for backward compat with cached data)
  wind_speed_10m: number[]; // km/h
  wind_gusts_10m: number[]; // km/h
  pressure_msl: number[]; // hPa
  relative_humidity_2m: number[]; // %
  dew_point_2m: number[]; // Celsius
  visibility: number[]; // meters
  uv_index: number[]; // Add this line
}

export interface DailyForecast {
  time: string[];
  temperature_2m_max: number[]; // Celsius
  temperature_2m_min: number[]; // Celsius
  precipitation_probability_max: number[]; // %
  weather_code: number[];
  wind_speed_10m_max: number[]; // km/h
  sunrise: string[]; // ISO, local to the location's timezone
  sunset: string[]; // ISO, local to the location's timezone
  daylight_duration: number[]; // seconds
  uv_index_max: number[]; // 0-11 scale
}

export interface ForecastResponse {
  timezone: string;
  current: CurrentWeather;
  hourly: HourlyForecast;
  daily: DailyForecast;
}

/** Current air quality reading. `us_aqi` uses the 0-500 US EPA AQI scale. */
export interface AirQuality {
  time: string;
  us_aqi: number;
  pm2_5: number; // ug/m3
  pm10: number; // ug/m3
  ozone: number; // ug/m3
  nitrogen_dioxide: number; // ug/m3
  sulphur_dioxide: number; // ug/m3
  carbon_monoxide: number; // ug/m3
  timezone: string; // Add this
  hourly?: {
    time: string[];    // Array of strings
    uv_index: number[];
  };
}

export async function searchCities(query: string): Promise<GeocodeResult[]> {
  if (!query.trim()) return [];
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', query);
  url.searchParams.set('count', '8');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to search cities');
  const data = await res.json();
  return (data.results ?? []).map(
    (r: {
      id: number;
      name: string;
      country: string;
      admin1?: string;
      latitude: number;
      longitude: number;
      timezone: string;
    }) => ({
      id: r.id,
      name: r.name,
      country: r.country,
      admin1: r.admin1,
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone,
    }),
  );
}

    const CACHE_TTL = 15 * 60 * 1000; // 15-minute cache

    export async function getForecast(
      latitude: number,
      longitude: number,
    ): Promise<ForecastResponse> {
      const cacheKey = `atmos_forecast_${latitude.toFixed(3)}_${longitude.toFixed(3)}`;

      // 1. Try to return cached data if fresh
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          return data;
        }
      }

      // 2. Build your original core URL logic
      const url = new URL('https://api.open-meteo.com/v1/forecast');
      url.searchParams.set('latitude', String(latitude));
      url.searchParams.set('longitude', String(longitude));
      url.searchParams.set(
        'current',
        [
          'temperature_2m', 'apparent_temperature', 'relative_humidity_2m',
          'dew_point_2m', 'precipitation', 'weather_code', 'wind_speed_10m',
          'wind_gusts_10m', 'wind_direction_10m', 'pressure_msl',
          'visibility', 'is_day',
        ].join(','),
      );
      url.searchParams.set(
        'hourly',
        [
          'temperature_2m', 'apparent_temperature', 'precipitation_probability',
          'weather_code', 'is_day', 'wind_speed_10m', 'wind_gusts_10m',
          'pressure_msl', 'relative_humidity_2m', 'dew_point_2m', 'visibility',
        ].join(','),
      );
      url.searchParams.set(
        'daily',
        [
          'temperature_2m_max', 'temperature_2m_min', 'precipitation_probability_max',
          'weather_code', 'wind_speed_10m_max', 'sunrise', 'sunset',
          'daylight_duration', 
          'uv_index_max' // Add this line
        ].join(','),
      );
      url.searchParams.set('timezone', 'auto');
      url.searchParams.set('wind_speed_unit', 'kmh');
      url.searchParams.set('precipitation_unit', 'mm');
      url.searchParams.set('temperature_unit', 'celsius');
      url.searchParams.set('forecast_days', '7');
      url.searchParams.set('past_hours', '6');

      // 3. Execute fetch with 429 intercept
      const res = await fetch(url.toString());

      // Intercept 429 and return stale cache if available
      if (res.status === 429) {
        const stale = localStorage.getItem(cacheKey);
        if (stale) return JSON.parse(stale).data;
      }

      if (!res.ok) throw new Error('Failed to fetch forecast');

      const data = await res.json();

      // 4. Save to cache before returning
      localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data }));

      return data;
    }

/** Current air quality (US AQI, 0-500 scale) for a location. Open-Meteo Air Quality API. */
export async function getAirQuality(latitude: number, longitude: number): Promise<AirQuality> {
  const url = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set(
    'current',
    [
      'us_aqi',
      'pm2_5',
      'pm10',
      'ozone',
      'nitrogen_dioxide',
      'sulphur_dioxide',
      'carbon_monoxide',
    ].join(','),
  );
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('hourly', 'uv_index'); // Add this to request the time-series data

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch air quality');
  const data = await res.json();
  return {
    time: data.current.time,
    us_aqi: data.current.us_aqi,
    pm2_5: data.current.pm2_5,
    pm10: data.current.pm10,
    ozone: data.current.ozone,
    nitrogen_dioxide: data.current.nitrogen_dioxide,
    sulphur_dioxide: data.current.sulphur_dioxide,
    carbon_monoxide: data.current.carbon_monoxide,
    hourly: data.hourly,
    timezone: data.timezone, // Ensure this matches your expected structure
  };
}

/** Reverse geocode browser geolocation coordinates to a place name. */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  try {
    // Engine 1: BigDataCloud (Fast, keyless, CORS-enabled client-side API)
    const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
    url.searchParams.set('latitude', String(latitude));
    url.searchParams.set('longitude', String(longitude));
    url.searchParams.set('localityLanguage', 'en');

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Primary geocoding status: ${res.status}`);
    
    const data = await res.json();
    
    // SWAP PRIORITY: 'locality' targets the exact town/suburb boundary, 
    // while 'city' scales up to the macro metropolitan area anchor.
    return data.locality || data.city || data.principalSubdivision || null;
    
  } catch (error) {
    console.warn("Primary reverse geocoding failed, trying fallback:", error);
    
    // Engine 2 Fallback: OpenStreetMap Nominatim
    try {
      const fallbackUrl = new URL('https://nominatim.openstreetmap.org/reverse');
      fallbackUrl.searchParams.set('format', 'jsonv2');
      fallbackUrl.searchParams.set('lat', String(latitude));
      fallbackUrl.searchParams.set('lon', String(longitude));

      const res = await fetch(fallbackUrl.toString());
      if (!res.ok) return null;
      
      const data = await res.json();
      const addr = data.address;
      
      if (!addr) return null;
      
      // Parse from the most granular neighborhood/town layer outwards to the macro city
      return addr.neighbourhood || addr.suburb || addr.town || addr.village || addr.city || null;
    } catch (fallbackError) {
      console.error("All reverse geocoding paths failed:", fallbackError);
      return null;
    }
  }
}

/**
 * Weather code (WMO) -> short description. Open-Meteo returns WMO codes;
 * this is the standard mapping used for icon/label selection.
 */
export function describeWeatherCode(code: number): string {
  const map: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Freezing fog',
    51: 'Light drizzle',
    53: 'Drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Freezing drizzle',
    61: 'Light rain',
    63: 'Rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Freezing rain',
    71: 'Light snow',
    73: 'Snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Light rain showers',
    81: 'Rain showers',
    82: 'Violent rain showers',
    85: 'Light snow showers',
    86: 'Snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with light hail',
    99: 'Thunderstorm with heavy hail',
  };
  return map[code] ?? 'Unknown';
}
