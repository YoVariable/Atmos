/**
 * Unit conversion and formatting helpers for the weather app.
 *
 * Temperature is locked to the custom "Felsius" scale (°Ꞓ) throughout the
 * UI. All other units are user-selectable via Settings and persisted in
 * localStorage. Defaults: 24-hour time, km/h wind, km distance, hPa pressure,
 * mm/cm precipitation (auto-range).
 *
 * Felsius definition: Felsius = (Celsius + Fahrenheit) / 2 = Celsius * 1.4 + 16
 * Sanity checks: 0 °C (freezing) → 16 °Ꞓ. 100 °C (boiling) → 156 °Ꞓ.
 */

// ─── Temperature (Felsius, locked) ──────────────────────────────────────────

export function celsiusToFelsius(celsius: number): number {
  return celsius * 1.4 + 16;
}
export function formatFelsius(celsius: number): string {
  return `${Math.round(celsiusToFelsius(celsius))}°Ꞓ`;
}
export function formatFelsiusValue(celsius: number): number {
  return Math.round(celsiusToFelsius(celsius));
}
export const FELSIUS_UNIT = '°Ꞓ';

// ─── Wind speed ──────────────────────────────────────────────────────────────

export type WindUnit = 'kmh' | 'ms' | 'mph' | 'kn' | 'bft';

export const WIND_UNIT_OPTIONS: { value: WindUnit; label: string; example: string }[] = [
  { value: 'kmh',  label: 'km/h',  example: 'Kilometres per hour' },
  { value: 'ms',   label: 'm/s',   example: 'Metres per second' },
  { value: 'mph',  label: 'mph',   example: 'Miles per hour' },
  { value: 'kn',   label: 'kn',    example: 'Knots' },
  { value: 'bft',  label: 'Bft',   example: 'Beaufort scale' },
];

function beaufortFromKmh(kmh: number): number {
  if (kmh < 2)   return 0;
  if (kmh < 6)   return 1;
  if (kmh < 12)  return 2;
  if (kmh < 20)  return 3;
  if (kmh < 29)  return 4;
  if (kmh < 39)  return 5;
  if (kmh < 50)  return 6;
  if (kmh < 62)  return 7;
  if (kmh < 75)  return 8;
  if (kmh < 89)  return 9;
  if (kmh < 103) return 10;
  if (kmh < 118) return 11;
  return 12;
}

export function convertWindSpeed(kmh: number, unit: WindUnit): number {
  switch (unit) {
    case 'kmh': return Math.round(kmh);
    case 'ms':  return Math.round((kmh / 3.6) * 10) / 10;
    case 'mph': return Math.round(kmh * 0.621371);
    case 'kn':  return Math.round(kmh * 0.539957);
    case 'bft': return beaufortFromKmh(kmh);
  }
}

export function windUnitLabel(unit: WindUnit): string {
  return WIND_UNIT_OPTIONS.find((o) => o.value === unit)?.label ?? 'km/h';
}

/** Formats a km/h value as a string in the requested unit, e.g. "24 km/h". */
export function formatWindSpeed(kmh: number, unit: WindUnit = 'kmh'): string {
  return `${convertWindSpeed(kmh, unit)} ${windUnitLabel(unit)}`;
}

// ─── Distance / Visibility ───────────────────────────────────────────────────

export type DistanceUnit = 'km' | 'mi';

export const DISTANCE_UNIT_OPTIONS: { value: DistanceUnit; label: string; example: string }[] = [
  { value: 'km', label: 'km', example: 'Kilometres' },
  { value: 'mi', label: 'mi', example: 'Miles' },
];

/** API visibility is in metres. */
export function formatVisibility(meters: number, unit: DistanceUnit = 'km'): string {
  if (unit === 'mi') return `${(meters / 1609.34).toFixed(1)} mi`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// ─── Pressure ────────────────────────────────────────────────────────────────

export type PressureUnit = 'hPa' | 'kPa' | 'mbar' | 'mmHg' | 'inHg';

export const PRESSURE_UNIT_OPTIONS: { value: PressureUnit; label: string; example: string }[] = [
  { value: 'hPa',  label: 'hPa',  example: 'Hectopascals (standard)' },
  { value: 'kPa',  label: 'kPa',  example: 'Kilopascals' },
  { value: 'mbar', label: 'mbar', example: 'Millibars' },
  { value: 'mmHg', label: 'mmHg', example: 'Millimetres of mercury' },
  { value: 'inHg', label: 'inHg', example: 'Inches of mercury' },
];

export function convertPressure(hpa: number, unit: PressureUnit): number {
  switch (unit) {
    case 'hPa':  return Math.round(hpa);
    case 'kPa':  return Math.round((hpa / 10) * 100) / 100;
    case 'mbar': return Math.round(hpa);
    case 'mmHg': return Math.round(hpa * 0.750062);
    case 'inHg': return Math.round(hpa * 0.0295301 * 100) / 100;
  }
}

export function pressureUnitLabel(unit: PressureUnit): string {
  return unit;
}

/** API pressure is in hPa. */
export function formatPressure(hpa: number, unit: PressureUnit = 'hPa'): string {
  return `${convertPressure(hpa, unit)} ${pressureUnitLabel(unit)}`;
}

// ─── Precipitation ───────────────────────────────────────────────────────────

export type PrecipitationUnit = 'mm_cm' | 'in';

export const PRECIPITATION_UNIT_OPTIONS: { value: PrecipitationUnit; label: string; example: string }[] = [
  { value: 'mm_cm', label: 'mm, cm', example: 'Auto-ranges from mm to cm' },
  { value: 'in',    label: 'in',     example: 'Inches' },
];

/** API precipitation is in mm. */
export function formatPrecipitation(mm: number, unit: PrecipitationUnit = 'mm_cm'): string {
  if (unit === 'in') return `${(mm / 25.4).toFixed(2)} in`;
  if (mm >= 10) return `${(mm / 10).toFixed(1)} cm`;
  return `${mm.toFixed(1)} mm`;
}

// ─── Time ─────────────────────────────────────────────────────────────────────

export type TimeFormat = '24h' | '12h';

export const TIME_FORMAT_OPTIONS: { value: TimeFormat; label: string; example: string }[] = [
  { value: '24h', label: '24-hour', example: '18:30' },
  { value: '12h', label: '12-hour', example: '6:30 PM' },
];

/** Full time string: "18:30" or "6:30 PM". */
export function formatTime(date: Date, fmt: TimeFormat = '24h'): string {
  const h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, '0');
  if (fmt === '12h') {
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${m} ${period}`;
  }
  return `${h.toString().padStart(2, '0')}:${m}`;
}

/** Short hour label for the hourly strip: "18" or "6 PM". */
export function formatHourLabel(date: Date, fmt: TimeFormat = '24h'): string {
  const h = date.getHours();
  if (fmt === '12h') {
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12} ${period}`;
  }
  return h.toString().padStart(2, '0');
}

export function formatHumidity(percent: number): string {
  return `${Math.round(percent)}%`;
}

// ─── Backward-compat aliases ─────────────────────────────────────────────────

/** @deprecated Use formatTime(date, settings.timeFormat) */
export function formatTime24(date: Date): string {
  return formatTime(date, '24h');
}
/** @deprecated Use formatHourLabel(date, settings.timeFormat) */
export function formatHour24(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:00`;
}
