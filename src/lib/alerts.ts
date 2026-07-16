/**
 * Local weather notices, generated purely from real forecast data (never
 * mocked). These are heuristic advisories -- not fetched from an official
 * warning authority -- so they are worded as generic advisories rather than
 * attributed to an agency like the National Weather Service.
 *
 * All thresholds are evaluated in Celsius (the API's native unit) and only
 * converted to Felsius for display, via the existing units.ts helpers.
 */

import type { CurrentWeather, DailyForecast } from './weather-api';

export type NoticeSeverity = 'warning' | 'advisory' | 'info';

export interface WeatherNotice {
  id: string;
  severity: NoticeSeverity;
  title: string;
  description: string;
}

/** Celsius thresholds for heat notices, based on common heat-advisory practice. */
const EXTREME_HEAT_APPARENT_C = 39; // ~ dangerous heat index territory
const HEAT_ADVISORY_APPARENT_C = 32;
const EXTREME_COLD_APPARENT_C = -25;
const COLD_ADVISORY_APPARENT_C = -15;
const HIGH_WIND_KMH = 60;

export function generateNotices(
  current: CurrentWeather,
  daily: DailyForecast,
): WeatherNotice[] {
  const notices: WeatherNotice[] = [];

  const todayHigh = daily.temperature_2m_max[0];
  const apparentNow = current.apparent_temperature;
  const worstHeat = Math.max(todayHigh, apparentNow);

  if (worstHeat >= EXTREME_HEAT_APPARENT_C) {
    notices.push({
      id: 'extreme-heat',
      severity: 'warning',
      title: 'Extreme Heat Warning',
      description:
        "Dangerously hot conditions are expected today. Limit time outdoors, stay hydrated, and check on those at higher risk.",
    });
  } else if (worstHeat >= HEAT_ADVISORY_APPARENT_C) {
    notices.push({
      id: 'heat-advisory',
      severity: 'advisory',
      title: 'Heat Advisory',
      description:
        "Hot conditions are expected today. Take breaks in the shade and drink plenty of water.",
    });
  }

  const todayLow = daily.temperature_2m_min[0];
  const worstCold = Math.min(todayLow, apparentNow);

  if (worstCold <= EXTREME_COLD_APPARENT_C) {
    notices.push({
      id: 'extreme-cold',
      severity: 'warning',
      title: 'Extreme Cold Warning',
      description:
        'Dangerously cold conditions are expected. Limit exposure and dress in insulated layers.',
    });
  } else if (worstCold <= COLD_ADVISORY_APPARENT_C) {
    notices.push({
      id: 'cold-advisory',
      severity: 'advisory',
      title: 'Cold Advisory',
      description: 'Cold conditions are expected today. Dress warmly and limit time outdoors.',
    });
  }

  if (current.wind_speed_10m >= HIGH_WIND_KMH) {
    notices.push({
      id: 'high-wind',
      severity: 'advisory',
      title: 'High Wind Advisory',
      description: 'Strong winds are being observed. Secure loose outdoor objects.',
    });
  }

  return notices;
}

/** A separate air-quality notice, generated from a real `us_aqi` reading. */
export function generateAqiNotice(aqi: number): WeatherNotice | null {
  if (aqi > 150) {
    return {
      id: 'air-quality',
      severity: aqi > 200 ? 'warning' : 'advisory',
      title: 'Unhealthy Air Quality',
      description: 'Air quality is degraded today. Sensitive groups should limit outdoor exertion.',
    };
  }
  return null;
}
