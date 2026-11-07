/**
 * Thin client for the Open-Meteo public APIs (no API key required, CORS-open).
 * All requests explicitly force metric units. Temperature is always requested
 * in Celsius from the API and MUST be converted to Felsius (see units.ts)
 * before being shown anywhere in the UI.
 */

import { getDominantDaytimeCode } from './weather-helpers';

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
  surface_pressure: number; // hPa
  visibility: number; // meters
  is_day: number; // 0 | 1
  uv_index?: number;
}

export interface HourlyForecast {
  time: string[];
  temperature_2m: number[]; // Celsius
  apparent_temperature: number[]; // Celsius
  precipitation_probability: number[]; // %
  precipitation: number[];
  weather_code: number[];
  is_day?: number[]; // 1 = day, 0 = night
  wind_speed_10m: number[]; // km/h
  wind_gusts_10m: number[]; // km/h
  pressure_msl: number[]; // hPa
  relative_humidity_2m: number[]; // %
  dew_point_2m: number[]; // Celsius
  visibility: number[]; // meters
  uv_index: number[];
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
  timezone: string;
  hourly?: {
    time: string[];
    uv_index: number[];
  };
}

const CACHE_TTL = 15 * 60 * 1000; // 15-minute cache

// Precipitation Constants
export const TRACE_PRECIPITATION_THRESHOLD = 0.2; // mm
export const DAILY_PRECIP_VOLUME_THRESHOLD = 5.0; // mm daily total override
export const HEAVY_HOURLY_RATE_THRESHOLD = 2.5;   // mm/h peak rate override

export async function searchCities(query: string): Promise<GeocodeResult[]> {
  if (!query.trim()) return [];
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', query);
  url.searchParams.set('count', '20'); // Up from 8 to pull smaller municipalities
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

/**
 * Gates weather codes against actual precipitation volume.
 */
function gateTracePrecipitation(code: number, precipAmount: number): number {
  const isPrecipitationCode = code >= 51 && code <= 99;
  
  if (isPrecipitationCode && precipAmount <= TRACE_PRECIPITATION_THRESHOLD) {
    return 3; // Overcast
  }
  return code;
}

/**
 * Maps Canadian permanent DST timezones to their permanent UTC offset targets.
 * BC/Yukon = UTC-7, AB/NWT = UTC-6, MB/NW-Ontario = UTC-5
 */
function getTargetUtcOffset(lat: number, lng: number, timezone: string): number | null {
  const tz = timezone.toLowerCase();

  // 1. Pacific Zone (UTC-7)
  if (tz.includes('vancouver') || tz.includes('whitehorse') || tz.includes('dawson')) {
    return -7; //
  }
  // 2. Mountain Zone (UTC-6)
  if (tz.includes('edmonton') || tz.includes('yellowknife') || tz.includes('inuvik') || tz.includes('regina')) {
    return -6; //
  }
  // 3. Central Zone (UTC-5)
  if (tz.includes('winnipeg') || tz.includes('rainy_river') || tz.includes('kenora')) {
    return -5; //
  }

  // Geographic Bounding Box Fallback for Western Canada & Northwest Territories
  if (lat >= 48.0 && lat <= 75.0 && lng >= -141.0 && lng <= -88.0) {
    if (lng < -114.0) return -7; // BC / Yukon
    if (lng < -102.0) return -6; // AB / NWT / SK
    return -5;                    // MB / NW Ontario
  }

  return null; // Not a permanent DST zone (e.g. Toronto, Montreal, Halifax)
}

/**
 * Shifts an ISO local time string by a given number of hours.
 */
function shiftIsoString(isoStr: string, hoursToAdd: number): string {
  const match = isoStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return isoStr;
  
  let [, year, month, day, hour, minute, second] = match;
  const d = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour) + hoursToAdd, Number(minute), Number(second || 0)));
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  const y = d.getUTCFullYear();
  const m = pad(d.getUTCMonth() + 1);
  const dayStr = pad(d.getUTCDate());
  const h = pad(d.getUTCHours());
  const min = pad(d.getUTCMinutes());
  const sec = second !== undefined ? `:${pad(d.getUTCSeconds())}` : '';
  
  return `${y}-${m}-${dayStr}T${h}:${min}${sec}`;
}

/**
 * Adjusts timestamps for Canadian permanent-DST zones during winter months
 * ONLY if the upstream API payload is still using legacy fall-back offsets.
 */
function applyCanadaPermanentOffset(data: ForecastResponse, latitude: number, longitude: number): ForecastResponse {
  const targetOffset = getTargetUtcOffset(latitude, longitude, data.timezone);

  // Exit early if the location is not in a Canadian permanent-DST zone
  if (targetOffset === null) {
    return data;
  }

  // Determine if upstream API is still delivering legacy standard-time local hours
  if (data.current && data.current.time) {
    const apiCurrentHour = new Date(data.current.time + 'Z').getUTCHours();
    const utcHour = new Date().getUTCHours();
    const expectedLocalHour = (utcHour + targetOffset + 24) % 24;

    // Check if the API current hour matches our expected permanent local hour
    const isLaggingBehind = apiCurrentHour !== expectedLocalHour;

    if (!isLaggingBehind) {
      // Upstream API has already updated its tzdb rules; no shift needed!
      return data;
    }
  }

  // Upstream is still lagging behind: add +1 hour shift to enforce permanent DST
  const transitionThreshold = '2026-11-01T00:00'; //
  const adjustTime = (t: string) => (t >= transitionThreshold ? shiftIsoString(t, 1) : t);

  if (data.current && data.current.time) {
    data.current.time = adjustTime(data.current.time);
  }

  if (data.hourly && data.hourly.time) {
    data.hourly.time = data.hourly.time.map(adjustTime);
  }

  if (data.daily) {
    if (data.daily.sunrise) {
      data.daily.sunrise = data.daily.sunrise.map(adjustTime);
    }
    if (data.daily.sunset) {
      data.daily.sunset = data.daily.sunset.map(adjustTime);
    }
  }

  return data;
}

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

  // 2. Build core URL logic
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set(
    'current',
    [
      'temperature_2m', 'apparent_temperature', 'relative_humidity_2m',
      'dew_point_2m', 'precipitation', 'weather_code', 'wind_speed_10m',
      'wind_gusts_10m', 'wind_direction_10m', 'pressure_msl',
      'surface_pressure',
      'visibility', 'is_day',
    ].join(','),
  );
  url.searchParams.set(
    'hourly',
    [
      'temperature_2m', 'apparent_temperature', 'precipitation_probability',
      'weather_code', 'is_day', 'wind_speed_10m', 'wind_gusts_10m',
      'pressure_msl', 'relative_humidity_2m', 'dew_point_2m', 'visibility',
      'precipitation',
    ].join(','),
  );
  url.searchParams.set(
    'daily',
    [
      'temperature_2m_max', 'temperature_2m_min', 'precipitation_probability_max',
      'weather_code', 'wind_speed_10m_max', 'sunrise', 'sunset',
      'daylight_duration', 
      'uv_index_max',
    ].join(','),
  );
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('wind_speed_unit', 'kmh');
  url.searchParams.set('precipitation_unit', 'mm');
  url.searchParams.set('temperature_unit', 'celsius');
  url.searchParams.set('forecast_days', '10');
  url.searchParams.set('past_hours', '6');

  // 3. Execute fetch with 429 intercept
  const res = await fetch(url.toString());

  if (res.status === 429) {
    const stale = localStorage.getItem(cacheKey);
    if (stale) return JSON.parse(stale).data;
  }

  if (!res.ok) throw new Error('Failed to fetch forecast');

  let data: ForecastResponse = await res.json();

  // --- APPLY CANADA PERMANENT DST OFFSET OVERRIDE ---
  data = applyCanadaPermanentOffset(data, latitude, longitude);

  // --- 1. GATE TRACE PRECIPITATION ---
  if (data.current) {
    data.current.weather_code = gateTracePrecipitation(
      data.current.weather_code,
      data.current.precipitation
    );
  }

  if (data.hourly && data.hourly.weather_code && data.hourly.precipitation) {
    data.hourly.weather_code = data.hourly.weather_code.map((code, index) => 
      gateTracePrecipitation(code, data.hourly.precipitation[index])
    );
  }

  // --- 2. CALCULATE DOMINANT DAILY CODES ---
  if (data.daily && data.hourly) {
    data.daily.weather_code = data.daily.time.map((dateString: string) =>
      getDominantDaytimeCode(data.hourly, data.daily, dateString)
    );
  }

  // 4. Save transformed data to cache before returning
  localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data }));

  return data;
}

/** Current air quality for a location. Open-Meteo Air Quality API. */
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
  url.searchParams.set('hourly', 'uv_index');

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
    timezone: data.timezone,
  };
}

/** Reverse geocode browser geolocation coordinates to a place name. */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('lat', String(latitude));
    url.searchParams.set('lon', String(longitude));
    // Set high detail zoom level (18 = building/street level detail)
    url.searchParams.set('zoom', '18'); 
    
    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'AtmosWeatherApp/1.5.1'
      }
    });

    if (res.ok) {
      const data = await res.json();
      const addr = data.address;
      
      if (addr) {
        // Prioritize fine-grained locality -> suburb -> district -> broader city
        const localName = 
          addr.neighbourhood ||
          addr.suburb ||
          addr.quarter ||
          addr.district ||
          addr.borough ||
          addr.town ||
          addr.village ||
          addr.hamlet ||
          addr.city;

        if (localName) return localName;
      }
    }
  } catch (error) {
    console.warn("Nominatim geocoding failed, trying fallback:", error);
  }

  // Fallback: BigDataCloud reverse geocode client
  try {
    const fallbackUrl = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
    fallbackUrl.searchParams.set('latitude', String(latitude));
    fallbackUrl.searchParams.set('longitude', String(longitude));
    fallbackUrl.searchParams.set('localityLanguage', 'en');
    
    const res = await fetch(fallbackUrl.toString());
    if (!res.ok) return null;
    
    const data = await res.json();
    // Prioritize locality / sublocality over broad city / subdivision
    return (
      data.localityInfo?.informative?.find((i: any) => i.order === 4)?.name ||
      data.locality || 
      data.city || 
      data.principalSubdivision || 
      null
    );
  } catch (fallbackError) {
    console.error("All reverse geocoding paths failed:", fallbackError);
    return null;
  }
}

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