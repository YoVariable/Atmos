/**
 * Air Quality Index helpers, using the US EPA AQI scale (0-500), the same
 * scale Open-Meteo's `us_aqi` field reports and the one most consumer
 * weather apps surface. All values are integers; never mocked -- always
 * derived from a real `us_aqi` reading returned by the Air Quality API.
 */

export interface AqiBand {
  label: string;
  description: string;
  /** Lower bound of the band's textual color, used for the gradient marker + text tint. */
  color: string;
}

const BANDS: { max: number; band: AqiBand }[] = [
  {
    max: 50,
    band: {
      label: 'Good',
      description: 'Air quality is satisfactory with little to no risk.',
      color: '34 197 94', // green (rgb triplet, used in rgb()/rgba())
    },
  },
  {
    max: 100,
    band: {
      label: 'Moderate',
      description: 'Air quality is acceptable for most people.',
      color: '234 179 8', // yellow
    },
  },
  {
    max: 150,
    band: {
      label: 'Unhealthy for Sensitive Groups',
      description: 'Sensitive groups may experience health effects.',
      color: '249 115 22', // orange
    },
  },
  {
    max: 200,
    band: {
      label: 'Unhealthy',
      description: 'Everyone may begin to experience health effects.',
      color: '239 68 68', // red
    },
  },
  {
    max: 300,
    band: {
      label: 'Very Unhealthy',
      description: 'Health alert: risk of health effects is increased for everyone.',
      color: '168 85 247', // purple
    },
  },
  {
    max: Infinity,
    band: {
      label: 'Hazardous',
      description: 'Health warning of emergency conditions, affecting everyone.',
      color: '136 19 55', // maroon
    },
  },
];

export function getAqiBand(aqi: number): AqiBand {
  return (BANDS.find((b) => aqi <= b.max) ?? BANDS[BANDS.length - 1]).band;
}

/** Position (0-1) of an AQI value along the 0-500 gradient scale, for a marker/bar UI. */
export function getAqiPosition(aqi: number): number {
  return Math.min(1, Math.max(0, aqi / 500));
}
