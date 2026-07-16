/**
 * Small qualitative-banding helpers used by the detail drawers. All bands
 * are derived from commonly published meteorological reference scales
 * (Beaufort wind scale, visibility categories, dew-point comfort scale),
 * applied to real API values -- never fabricated numbers.
 */

const COMPASS_LABELS = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
];

export function getWindDirectionLabel(degrees: number): string {
  const index = Math.round(((degrees % 360) / 22.5)) % 16;
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
