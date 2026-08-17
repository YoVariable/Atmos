/**
 * Small qualitative-banding helpers used by the detail drawers. All bands
 * are derived from commonly published meteorological reference scales
 * (Beaufort wind scale, visibility categories, dew-point comfort scale),
 * applied to real API values -- never fabricated numbers.
 */

import { celsiusToFelsius } from './units';

import {
  HourlyForecast,
  CurrentWeather,
  DailyForecast,
  TRACE_PRECIPITATION_THRESHOLD,
  DAILY_PRECIP_VOLUME_THRESHOLD,
  HEAVY_HOURLY_RATE_THRESHOLD,
} from './weather-api';

/**
 * Determines Today's effective weather code by synchronizing the current hour's
 * raw condition with the TRACE_PRECIPITATION_THRESHOLD rule.
 */
export function getTodayEffectiveCode(
  hourly: HourlyForecast,
  current: CurrentWeather,
  startIdx: number
): number {
  const rawCurrentCode =
    startIdx !== -1 && hourly.weather_code[startIdx] !== undefined
      ? hourly.weather_code[startIdx]
      : current?.weather_code ?? 3;

  const currentPrecip =
    startIdx !== -1 &&
    hourly.precipitation &&
    hourly.precipitation[startIdx] !== undefined
      ? hourly.precipitation[startIdx]
      : 0;

  const currentHasMeasurableRain = currentPrecip >= TRACE_PRECIPITATION_THRESHOLD;

  let displayCode = rawCurrentCode;
  if (
    (!currentHasMeasurableRain && isPrecipitationCode(rawCurrentCode)) ||
    (currentPrecip >= TRACE_PRECIPITATION_THRESHOLD &&
      (rawCurrentCode === 0 || rawCurrentCode === 1))
  ) {
    displayCode = 3; // Overcast fallback for trace/sub-measurable precipitation
  }

  return displayCode;
}

const COMPASS_LABELS = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
];

export function getWindDirectionLabel(degrees: number): string {
  const index = Math.round((degrees % 360) / 22.5) % 16;
  return COMPASS_LABELS[(index + 16) % 16];
}

/** Simplified Beaufort-scale description for a km/h wind speed. */
export function getWindDescription(kmh: number): string {
  if (kmh < 2) return 'Calm';
  if (kmh < 12) return 'Light breeze';
  if (kmh < 30) return 'Moderate breeze';
  if (kmh < 50) return 'Strong breeze';
  if (kmh < 75) return 'Gale';
  return 'Severe gale';
}

export const isPrecipitationCode = (weatherCode: number) =>
  [
    51, 53, 55, 56, 57, // Drizzle & Freezing Drizzle
    61, 63, 65, 66, 67, // Rain & Freezing Rain
    71, 73, 75, 77,     // Snow & Snow Grains
    80, 81, 82,         // Rain Showers
    85, 86,             // Snow Showers
  ].includes(weatherCode);

export interface VisibilityBand {
  label: string;
  description: string;
}

export function getVisibilityBand(meters: number): VisibilityBand {
  const km = meters / 1000;
  if (km >= 10) return { label: 'Excellent', description: 'Distant landmarks are clearly visible.' };
  if (km >= 4) return { label: 'Good', description: 'Most landmarks are clearly visible.' };
  if (km >= 1) return { label: 'Moderate', description: 'Visibility is somewhat reduced.' };
  return { label: 'Poor', description: 'Visibility is significantly reduced.' };
}

/** Comfort description from dew point in Celsius (standard meteorological bands). */
export function getDewPointComfort(dewPointC: number): string {
  if (dewPointC < 10) return 'Dry and comfortable';
  if (dewPointC < 16) return 'Comfortable';
  if (dewPointC < 18) return 'A bit humid';
  if (dewPointC < 21) return 'Somewhat uncomfortable';
  if (dewPointC < 24) return 'Humid and sticky';
  return 'Oppressive';
}

export type PressureTrend = 'rising' | 'falling' | 'steady';

export function getPressureTrend(deltaHpa: number): PressureTrend {
  if (deltaHpa >= 1) return 'rising';
  if (deltaHpa <= -1) return 'falling';
  return 'steady';
}

export function getPressureTrendDescription(trend: PressureTrend): string {
  if (trend === 'rising') return 'Rising pressure often signals improving or stable weather ahead.';
  if (trend === 'falling') return 'Falling pressure can signal changing or unsettled weather ahead.';
  return 'Pressure has been steady, suggesting little change ahead.';
}

export type WmoCode = number;

export interface HourlyWeatherData {
  time: string[]; // e.g. ["2026-07-30T00:00", "2026-07-30T01:00", ...]
  weather_code: WmoCode[];
}

export interface DailyWeatherData {
  time: string[]; // e.g. ["2026-07-30"]
  sunrise: string[]; // e.g. ["2026-07-30T06:05"]
  sunset: string[]; // e.g. ["2026-07-30T19:54"]
}

/**
 * Calculates the dominant daily weather code for a given date.
 * Hierarchy: Severe Thunderstorms > Snow/Ice > Precip Volume Overrides > Daytime Frequency Rollup.
 */
export function getDominantDaytimeCode(
  hourly: HourlyForecast,
  daily: DailyForecast,
  dateString: string
): number {
  const dayIndices: number[] = [];
  hourly.time.forEach((t, i) => {
    if (t.startsWith(dateString)) {
      dayIndices.push(i);
    }
  });

  if (dayIndices.length === 0) return 0;

  const dayPrecip = dayIndices.map((i) => hourly.precipitation[i] ?? 0);
  const dayCodes = dayIndices.map((i) => hourly.weather_code[i]);
  const daytimeMask = dayIndices.map((i) => (hourly.is_day ? hourly.is_day[i] === 1 : true));

  const daytimeCodes = dayCodes.filter((_, idx) => daytimeMask[idx]);
  const activeCodes = daytimeCodes.length > 0 ? daytimeCodes : dayCodes;

  // 1. SEVERE WEATHER OVERRIDE (Thunderstorms & Hail)
  const severeCode = dayCodes.find(
    (code) => (code >= 89 && code <= 90) || (code >= 95 && code <= 99)
  );
  if (severeCode !== undefined) {
    return severeCode;
  }
  
  const totalPrecip = dayPrecip.reduce((sum, val) => sum + val, 0);
  const maxHourlyPrecip = Math.max(...dayPrecip);
  const peakIndex = dayPrecip.indexOf(maxHourlyPrecip);
  const peakCode = dayCodes[peakIndex];

  // Helper for snow and freezing rain codes
  const isSnowOrIce = (code: number) =>
    (code >= 71 && code <= 77) || (code >= 85 && code <= 86) || code === 66 || code === 67;

  // 2. SNOW / ICE OVERRIDE
  if (totalPrecip >= TRACE_PRECIPITATION_THRESHOLD && isSnowOrIce(peakCode)) {
    return peakCode;
  }

  // 3. VOLUME / SEVERITY OVERRIDE (Heavy Rain)
  if (
    totalPrecip >= DAILY_PRECIP_VOLUME_THRESHOLD ||
    maxHourlyPrecip >= HEAVY_HOURLY_RATE_THRESHOLD
  ) {
    // Escalate drizzle (51-57) to Moderate Rain (63) under high volume/intensity
    if (peakCode >= 51 && peakCode <= 57) return 63;
    return peakCode >= 51 && peakCode <= 99 ? peakCode : 61;
  }

  // 4. DAYTIME DURATION / FREQUENCY ROLLUP (Fallback for dry/light days)
  const frequencyMap = new Map<number, number>();
  let maxCount = 0;
  let dominantCode = activeCodes[0] ?? 0;

  for (const code of activeCodes) {
    const count = (frequencyMap.get(code) ?? 0) + 1;
    frequencyMap.set(code, count);
    if (count > maxCount) {
      maxCount = count;
      dominantCode = code;
    }
  }

  return dominantCode;
}

// --- Felsius & Temperature Bar Formatting ---

export interface BarMetrics {
  leftPercent: number;
  widthPercent: number;
  showCurrentDot: boolean;
  dotPercent: number; // 0% to 100% relative to the inner bar
}

/**
 * Calculates bar track bounds and indicator dot positioning using raw Celsius API inputs.
 */
export function calculateBarMetrics(
  dayMin: number,
  dayMax: number,
  globalMin: number,
  globalMax: number,
  isToday: boolean,
  currentTemp?: number
): BarMetrics {
  const globalRange = Math.max(globalMax - globalMin, 0.1);
  const leftPercent = Math.max(0, Math.min(100, ((dayMin - globalMin) / globalRange) * 100));
  const rightPercent = Math.max(0, Math.min(100, ((dayMax - globalMin) / globalRange) * 100));
  const widthPercent = Math.max(4, rightPercent - leftPercent);

  let dotPercent = 0;
  let showCurrentDot = false;

  if (isToday && currentTemp !== undefined) {
    showCurrentDot = true;
    const dayRange = Math.max(dayMax - dayMin, 0.1);
    const clampedCurrent = Math.max(dayMin, Math.min(dayMax, currentTemp));
    dotPercent = Math.max(0, Math.min(100, ((clampedCurrent - dayMin) / dayRange) * 100));
  }

  return { leftPercent, widthPercent, showCurrentDot, dotPercent };
}

interface ColorStop {
  tempFelsius: number;
  r: number;
  g: number;
  b: number;
}

// Absolute color anchors on the Felsius scale (°Ꞓ)
const FELSIUS_COLOR_STOPS: ColorStop[] = [
  { tempFelsius: -60, r: 120, g: 80, b: 220 }, // Deep Violet (Extreme Sub-Zero)
  { tempFelsius: -30, r: 70, g: 90, b: 230 }, // Cold Indigo
  { tempFelsius: 0, r: 56, g: 140, b: 248 }, // Frozen Blue (-11.4°C)
  { tempFelsius: 16, r: 56, g: 189, b: 248 }, // Ice / Freezing Point (0°C)
  { tempFelsius: 30, r: 45, g: 212, b: 191 }, // Soft Teal / Chilly (10°C)
  { tempFelsius: 42, r: 163, g: 230, b: 53 }, // Lime / Cool Crisp (18.5°C)
  { tempFelsius: 50, r: 250, g: 204, b: 21 }, // Warm Gold / Room Temp (24.3°C)
  { tempFelsius: 58, r: 245, g: 158, b: 11 }, // Amber / Warm (30°C)
  { tempFelsius: 68, r: 249, g: 115, b: 22 }, // Vibrant Hot Orange / Summer (37°C)
  { tempFelsius: 78, r: 239, g: 68, b: 68 }, // Blazing Red / Sweltering (44.3°C)
  { tempFelsius: 90, r: 190, g: 18, b: 60 }, // Crimson / Heatwave (52.8°C+)
];

function interpolateColor(felsius: number): string {
  if (felsius <= FELSIUS_COLOR_STOPS[0].tempFelsius) {
    const { r, g, b } = FELSIUS_COLOR_STOPS[0];
    return `rgb(${r}, ${g}, ${b})`;
  }
  const last = FELSIUS_COLOR_STOPS[FELSIUS_COLOR_STOPS.length - 1];
  if (felsius >= last.tempFelsius) {
    return `rgb(${last.r}, ${last.g}, ${last.b})`;
  }

  for (let i = 0; i < FELSIUS_COLOR_STOPS.length - 1; i++) {
    const s1 = FELSIUS_COLOR_STOPS[i];
    const s2 = FELSIUS_COLOR_STOPS[i + 1];
    if (felsius >= s1.tempFelsius && felsius <= s2.tempFelsius) {
      const factor = (felsius - s1.tempFelsius) / (s2.tempFelsius - s1.tempFelsius);
      const r = Math.round(s1.r + factor * (s2.r - s1.r));
      const g = Math.round(s1.g + factor * (s2.g - s1.g));
      const b = Math.round(s1.b + factor * (s2.b - s1.b));
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  return `rgb(255, 255, 255)`;
}

/**
 * Accepts raw Celsius temperatures from the API, converts to Felsius,
 * and generates a CSS linear-gradient string anchored to absolute °Ꞓ colors.
 */
export function getFelsiusBarGradient(lowCelsius: number, highCelsius: number): string {
  const lowF = celsiusToFelsius(lowCelsius);
  const highF = celsiusToFelsius(highCelsius);

  if (highF <= lowF) return interpolateColor(lowF);

  const range = highF - lowF;
  const stops: string[] = [];

  stops.push(`${interpolateColor(lowF)} 0%`);

  for (const stop of FELSIUS_COLOR_STOPS) {
    if (stop.tempFelsius > lowF && stop.tempFelsius < highF) {
      const pct = Math.round(((stop.tempFelsius - lowF) / range) * 100);
      stops.push(`rgb(${stop.r}, ${stop.g}, ${stop.b}) ${pct}%`);
    }
  }

  stops.push(`${interpolateColor(highF)} 100%`);

  return `linear-gradient(to right, ${stops.join(', ')})`;
}