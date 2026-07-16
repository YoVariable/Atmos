/**
 * Astronomical sunrise/sunset calculations (NOAA solar position formulas),
 * used to derive representative sunrise/sunset times for months that are
 * outside the forecast API's window (Open-Meteo only returns real
 * sunrise/sunset for the next ~16 days). Never mocked -- this is a real
 * solar-declination calculation from the location's actual latitude, which
 * is why the longest day naturally lands on the correct hemisphere's
 * summer solstice (June for northern latitudes, December for southern).
 *
 * Accuracy is within ~1-2 minutes of true sunrise/sunset, which is more
 * than sufficient for a monthly-trend visualization.
 */

export interface DaySunTimes {
  sunrise: Date | null;
  sunset: Date | null;
  daylightMinutes: number;
}

export interface MonthSunlight {
  month: number; // 0-11
  daylightHours: number;
  sunrise: Date;
  sunset: Date;
}

function dayOfYearUTC(year: number, month: number, day: number): number {
  return Math.round((Date.UTC(year, month, day) - Date.UTC(year, 0, 1)) / 86400000) + 1;
}

/** Sunrise/sunset (as UTC instants) for a given calendar date at a given location. */
export function calcSunTimes(
  latitude: number,
  longitude: number,
  year: number,
  month: number, // 0-11
  day: number,
): DaySunTimes {
  const n = dayOfYearUTC(year, month, day);
  const gamma = ((2 * Math.PI) / 365) * (n - 1);

  const eqtime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  const latRad = (latitude * Math.PI) / 180;
  const zenith = (90.833 * Math.PI) / 180; // accounts for refraction + solar radius

  const cosHA =
    Math.cos(zenith) / (Math.cos(latRad) * Math.cos(decl)) - Math.tan(latRad) * Math.tan(decl);

  const utcMidnight = Date.UTC(year, month, day);

  if (cosHA > 1) {
    // Polar night: sun never rises
    return { sunrise: null, sunset: null, daylightMinutes: 0 };
  }
  if (cosHA < -1) {
    // Midnight sun: sun never sets
    return { sunrise: null, sunset: null, daylightMinutes: 1440 };
  }

  const haDeg = (Math.acos(cosHA) * 180) / Math.PI;
  const sunriseMinutes = 720 - 4 * (longitude + haDeg) - eqtime;
  const sunsetMinutes = 720 - 4 * (longitude - haDeg) - eqtime;

  return {
    sunrise: new Date(utcMidnight + sunriseMinutes * 60000),
    sunset: new Date(utcMidnight + sunsetMinutes * 60000),
    daylightMinutes: sunsetMinutes - sunriseMinutes,
  };
}

/** Representative (15th-of-month) sunrise/sunset/daylight for all 12 months of `year`. */
export function getMonthlySunlight(latitude: number, longitude: number, year: number): MonthSunlight[] {
  const months: MonthSunlight[] = [];
  for (let m = 0; m < 12; m++) {
    const { sunrise, sunset, daylightMinutes } = calcSunTimes(latitude, longitude, year, m, 15);
    months.push({
      month: m,
      daylightHours: daylightMinutes / 60,
      sunrise: sunrise ?? new Date(Date.UTC(year, m, 15, 6, 0)),
      sunset: sunset ?? new Date(Date.UTC(year, m, 15, 18, 0)),
    });
  }
  return months;
}

/** Progress (0-1) of `now` between `sunrise` and `sunset`, clamped. */
export function getSunProgress(now: Date, sunrise: Date, sunset: Date): number {
  const total = sunset.getTime() - sunrise.getTime();
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, (now.getTime() - sunrise.getTime()) / total));
}
