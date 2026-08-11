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

// ── Air Pollution Conversion & Constants ──

// High-precision universal gas constant (SI units: J / (mol · K))
const R_SI = 8.314462618;

// High-precision molecular weights (g/mol) for Atmos gas pollutants
export const GAS_MOLECULAR_WEIGHTS: Record<string, number> = {
  OZONE: 47.9982, // O₃
  NO2: 46.0055,   // Nitrogen dioxide
  SO2: 64.0638,   // Sulfur dioxide
  CO: 28.0101,    // Carbon monoxide
};

/**
 * Converts Felsius to Celsius based on the custom definition:
 * Felsius = Celsius * 1.4 + 16  =>  Celsius = (Felsius - 16) / 1.4
 */
export function felsiusToCelsius(felsius: number): number {
  return (felsius - 16) / 1.4;
}

/**
 * Converts Felsius directly to Kelvin via Celsius
 */
export function felsiusToKelvin(felsius: number): number {
  const celsius = felsiusToCelsius(felsius);
  return celsius + 273.15;
}

/**
 * Converts gas concentration from µg/m³ to ppbv using high-precision parameters
 * Expects temperature in Celsius, as provided natively by the weather API.
 */
export function convertUgM3ToPpblv(
  μgm3: number,
  molecularWeight: number,
  tempCelsius: number, 
  pressurePa: number
): number {
  const tempKelvin = tempCelsius + 273.15;
  return (μgm3 * R_SI * tempKelvin * 1000) / (pressurePa * molecularWeight);
}

// ─── Wind speed ──────────────────────────────────────────────────────────────

export type WindUnit = 'kmh' | 'ms' | 'mph' | 'fts' | 'kn' | 'bft';

export const WIND_UNIT_OPTIONS: { value: WindUnit; label: string; example: string }[] = [
  { value: 'kmh',  label: 'km/h',  example: 'Kilometres per hour' },
  { value: 'ms',   label: 'm/s',   example: 'Metres per second' },
  { value: 'mph',  label: 'mph',   example: 'Miles per hour' },
  { value: 'fts',  label: 'ft/s',  example: 'Feet per second' },
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
    case 'ms':  return Math.round((kmh / 3.6) * 10) / 10;         // Maintains 0.1 m/s resolution
    case 'mph': return Math.round(kmh / 1.609344);                // Exact NIST international mile
    case 'fts': return Math.round(((kmh / 1.09728) * 10)) / 10;   // Maintains 0.1 ft/s resolution
    case 'kn':  return Math.round(kmh / 1.852);                   // Exact ISO nautical mile
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

/** API visibility is in metres. (1 mile = 1609.344 m exactly) */
export function formatVisibility(meters: number, unit: DistanceUnit = 'km'): string {
  if (unit === 'mi') return `${(meters / 1609.344).toFixed(1)} mi`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// ─── Pressure ────────────────────────────────────────────────────────────────

export type PressureUnit = 'hPa' | 'kPa' | 'mbar' | 'mmHg' | 'inHg' | 'Pa' | 'atm' | 'psi';

export const PRESSURE_UNIT_OPTIONS: { value: PressureUnit; label: string; example: string }[] = [
  { value: 'hPa',  label: 'hPa',  example: 'Hectopascals (standard)' },
  { value: 'kPa',  label: 'kPa',  example: 'Kilopascals' },
  { value: 'mbar', label: 'mbar', example: 'Millibars' },
  { value: 'mmHg', label: 'mmHg', example: 'Millimetres of mercury' },
  { value: 'inHg', label: 'inHg', example: 'Inches of mercury' },
  { value: 'Pa',   label: 'Pa',   example: 'Pascals (SI base unit)' },
  { value: 'atm',  label: 'atm',  example: 'Standard atmospheres' },
  { value: 'psi',  label: 'psi',  example: 'Pounds per square inch' },
];

/**
 * Converts API pressure (in hPa / mbar) to raw unrounded target unit.
 * Uses exact NIST/ISO constants to maintain full 64-bit float precision.
 */
export function convertPressure(hpa: number, unit: PressureUnit): number {
  switch (unit) {
    case 'hPa':  return hpa;
    case 'mbar': return hpa;
    case 'kPa':  return hpa / 10;
    case 'Pa':   return hpa * 100;
    case 'mmHg': return hpa / 1.33322387415;
    case 'inHg': return hpa / 33.86388640341;
    case 'atm':  return hpa / 1013.25;
    case 'psi':  return hpa / 68.94757293168362;
  }
}

export function pressureUnitLabel(unit: PressureUnit): string {
  return unit;
}

/** Formats API pressure (hPa) into a standardized string with appropriate decimal precision. */
export function formatPressureValue(hpa: number, unit: PressureUnit): string {
  const val = convertPressure(hpa, unit);

  switch (unit) {
    case 'inHg':
    case 'kPa':
    case 'psi':
      return val.toFixed(2);
    case 'hPa':
    case 'mbar':
    case 'mmHg':
      return val.toFixed(1);
    case 'atm':
      return val.toFixed(3);
    case 'Pa':
      return Math.round(val)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
  }
}

/** Formats API pressure into a standardized string with its unit label. */
export function formatPressure(hpa: number, unit: PressureUnit = 'hPa'): string {
  return `${formatPressureValue(hpa, unit)}\u2009${pressureUnitLabel(unit)}`;
}

// ─── Precipitation ───────────────────────────────────────────────────────────

export type PrecipitationUnit = 'mm_cm' | 'in';

export const PRECIPITATION_UNIT_OPTIONS: { value: PrecipitationUnit; label: string; example: string }[] = [
  { value: 'mm_cm', label: 'mm, cm', example: 'Auto-ranges from mm to cm' },
  { value: 'in',    label: 'in',     example: 'Inches' },
];

/** API precipitation is in mm. (1 inch = 25.4 mm exactly) */
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

// ─── Elevation ───────────────────────────────────────────────────────────────

export type ElevationUnit = 'm' | 'ft';

export const ELEVATION_UNIT_OPTIONS: { value: ElevationUnit; label: string }[] = [
  { value: 'm', label: 'm' },
  { value: 'ft', label: 'ft' },
];

// ─── Coordinates ─────────────────────────────────────────────────────────────

export type CoordinateFormat = 'dms' | 'decimal';

export const COORDINATE_FORMAT_OPTIONS: { value: CoordinateFormat; label: string }[] = [
  { value: 'dms', label: 'DMS (° \' \")' },
  { value: 'decimal', label: 'Decimal Degrees (°)' },
];

// ─── Air Pollution ───────────────────────────────────────────────────────────

/**
 * Converts micrograms per cubic metre (µg/m³) to grains per cubic foot (gr/ft³).
 * Uses exact international standard definitions for mass and length.
 */
export function convertUgM3ToGrFt3(ugm3: number): number {
  return (ugm3 * 0.028316846592) / 64798.91;
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