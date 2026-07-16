import { useWeather, useAirQuality } from '@/lib/use-weather';
import { describeWeatherCode } from '@/lib/weather-api';
import { getWeatherIcon, getWeatherColor } from '@/lib/weather-icons';
import { getAqiBand, getAqiPosition } from '@/lib/aqi';
import { generateNotices, generateAqiNotice, type WeatherNotice } from '@/lib/alerts';
import { useDayNight } from '@/lib/use-day-night';
import * as SunCalc from 'suncalc';
import {
  formatFelsius,
  formatFelsiusValue,
  formatWindSpeed,
  formatPressure,
  formatVisibility,
  formatHumidity,
  formatTime,
  formatHourLabel,
  windUnitLabel,
  convertWindSpeed,
  convertPressure,
  pressureUnitLabel,
  FELSIUS_UNIT,
} from '@/lib/units';
import {
  Wind,
  Droplets,
  Eye,
  Gauge,
  Clock,
  CalendarDays,
  Loader2,
  AlertCircle,
  Navigation,
  AlertTriangle,
  Sunrise,
  Sunset,
  Wind as WindIcon,
  Thermometer,
  Cloud,
} from 'lucide-react';
import type { SavedLocation } from '@/lib/use-locations';
import { useEffect } from 'react';
import { DetailSheet } from '@/components/details/detail-sheet';
import { AirQualityDetailContent } from '@/components/details/air-quality-detail';
import { SunriseSunsetDetailContent } from '@/components/details/sunrise-sunset-detail';
import { WindDetailContent } from '@/components/details/wind-detail';
import { FeelsLikeDetailContent } from '@/components/details/feels-like-detail';
import { HumidityDetailContent } from '@/components/details/humidity-detail';
import { VisibilityDetailContent } from '@/components/details/visibility-detail';
import { PressureDetailContent } from '@/components/details/pressure-detail';
import { DailyDetailContent } from '@/components/details/daily-detail';
import { parseLocalDateString } from '@/lib/date-utils';
import { useSettings } from '@/lib/use-settings';

interface WeatherDisplayProps {
  location: SavedLocation;
  isActive?: boolean;
}

const CARD_TRIGGER_CLASS =
  'glass-panel p-4 sm:p-5 flex flex-col justify-between text-left w-full active:scale-[0.97] transition-transform';

export function WeatherDisplay({ location, isActive }: WeatherDisplayProps) {
  const { settings } = useSettings();
  // In weather-display.tsx (Around Line 63)

  // Add this helper function inside the component
  const getFormattedDate = (date: Date) => {
    // If the setting is 'dmy', use 'en-GB' format
    if (settings.longDateFormat === 'dmy') {
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    // Default to 'en-US' (Month-Day-Year)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const { data, isLoading, error } = useWeather(location.latitude, location.longitude);
const timezone = location.timezone === "auto" ? undefined : location.timezone;
const cityTimeDate = new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
const cityTime = (cityTimeDate.getHours() * 3600000) + (cityTimeDate.getMinutes() * 60000);

const sunriseDate = new Date(data?.daily.sunrise[0] || 0);
const sunriseTime = (sunriseDate.getHours() * 3600000) + (sunriseDate.getMinutes() * 60000);

const sunsetDate = new Date(data?.daily.sunset[0] || 0);
const sunsetTime = (sunsetDate.getHours() * 3600000) + (sunsetDate.getMinutes() * 60000);

const isDay = cityTime > sunriseTime && cityTime < sunsetTime;

// DEBUG: This will show you exactly what values are being compared in the console
console.log("DEBUG:", { 
  cityTime, 
  sunriseTime, 
  sunsetTime, 
  isDay, 
  timezone 
});

  const { data: airQuality } = useAirQuality(location.latitude, location.longitude);

  useEffect(() => {
    if (isActive && data?.current) {
      const color = getWeatherColor(data.current.weather_code, data.current.is_day);
      const glow = document.getElementById('ambient-glow');
      if (glow) glow.style.backgroundColor = color;
    }
  }, [data, isActive]);

  if (isLoading) {
    return (
      <div className="flex-1 min-h-[80vh] flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <div className="text-sm text-muted-foreground font-medium animate-pulse">Reading instruments...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 min-h-[80vh] flex flex-col items-center justify-center p-8 space-y-4 text-center">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <div>
          <div className="font-medium text-destructive">Failed to read instruments</div>
          <div className="text-sm text-muted-foreground mt-1">Please try again later.</div>
        </div>
      </div>
    );
  }

  const { current, hourly, daily } = data;

  const notices: WeatherNotice[] = [
    ...generateNotices(current, daily),
    ...(airQuality
      ? [generateAqiNotice(airQuality.us_aqi)].filter((n): n is WeatherNotice => n !== null)
      : []),
  ];

  // Ensure these variables are derived from the selected city's daily data
  // daily properties are arrays (one entry per day), use the first day's values
  const sunrise = new Date(daily.sunrise[0]);
  const sunset = new Date(daily.sunset[0]);

  const todayHigh = daily.temperature_2m_max[0];
  const todayLow = daily.temperature_2m_min[0];

  // Polar night: sun never rises (<1 min daylight). Midnight sun: never sets (>23h59m).
  const isPolarNight = daily.daylight_duration[0] < 60;
  const isMidnightSun = daily.daylight_duration[0] > 86340;
  const isSpecialSun = isPolarNight || isMidnightSun;

  // Rolling 24-hour window from now (floored to the start of the current hour to prevent skipping)
  const currentHourStartMs = new Date(current.time).setHours(new Date(current.time).getHours(), 0, 0, 0);
  let startIdx = hourly.time.findIndex((t) => new Date(t).getTime() >= currentHourStartMs);
  if (startIdx === -1) startIdx = 0;
  const windowSize = 24;
  const endIdx = Math.min(hourly.time.length, startIdx + windowSize);

  type TimelineItem =
    | { kind: 'hour'; time: Date; index: number }
    | { kind: 'sun'; time: Date; event: 'sunrise' | 'sunset' };

  const timeline: TimelineItem[] = [];
  for (let i = startIdx; i < endIdx; i++) {
    timeline.push({ kind: 'hour', time: new Date(hourly.time[i]), index: i });
  }
  // Only inject sun events for normal solar days (skip sentinel midnight values)
  if (!isSpecialSun) {
    const windowStart = new Date(hourly.time[startIdx]).getTime();
    const windowEnd = new Date(hourly.time[endIdx - 1]).getTime();
    daily.sunrise.forEach((s) => {
      const t = new Date(s).getTime();
      if (t >= windowStart && t <= windowEnd) timeline.push({ kind: 'sun', time: new Date(s), event: 'sunrise' });
    });
    daily.sunset.forEach((s) => {
      const t = new Date(s).getTime();
      if (t >= windowStart && t <= windowEnd) timeline.push({ kind: 'sun', time: new Date(s), event: 'sunset' });
    });
  }
  timeline.sort((a, b) => a.time.getTime() - b.time.getTime());

  // Location display name — add region for Antarctica entries
  const displayName =
    location.name === 'Antarctica' && location.country === 'Antarctica'
      ? 'Antarctica (general)'
      : location.name;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pb-24 pt-12 sm:pt-20 space-y-4 relative z-10 animate-in fade-in duration-700 ease-out">
      {/* Hero Header */}
      <section className="flex flex-col items-center text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-1">
          {displayName}
        </h1>
        <div className="text-lg text-foreground/80 mb-4 font-medium tracking-tight">
          {describeWeatherCode(current.weather_code)}
        </div>

        <div className="flex items-start justify-center tracking-tighter text-foreground mb-4">
          <span className="text-[7rem] sm:text-[9rem] font-light leading-none -ml-4">
            {formatFelsiusValue(current.temperature_2m)}
          </span>
          <span className="text-4xl sm:text-5xl font-light mt-2 sm:mt-4 ml-1 text-primary">
            {FELSIUS_UNIT}
          </span>
        </div>

        <div className="text-sm sm:text-base text-foreground/80 font-medium flex items-center justify-center gap-3">
          <span>H: {formatFelsius(todayHigh)}</span>
          <span>L: {formatFelsius(todayLow)}</span>
        </div>
      </section>

      {/* Notices */}
      {notices.length > 0 && (
        <section className="space-y-3">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className={`glass-panel p-4 flex items-start gap-3 ${
                notice.severity === 'warning' ? 'bg-destructive/10 border-destructive/20' : ''
              }`}
            >
              <AlertTriangle
                className={`w-5 h-5 mt-0.5 shrink-0 ${
                  notice.severity === 'warning' ? 'text-destructive' : 'text-primary'
                }`}
              />
              <div className="space-y-1">
                <div className="font-semibold text-sm">{notice.title}</div>
                <div className="text-sm text-foreground/80 leading-relaxed">{notice.description}</div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Hourly Strip */}
      <section className="glass-panel p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground/60 mb-4 border-b border-black/5 pb-3">
          <Clock className="w-4 h-4" />
          <span>Hourly Forecast</span>
        </div>
        <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {timeline.map((item) => {
            if (item.kind === 'sun') {
              const SunIcon = item.event === 'sunrise' ? Sunrise : Sunset;
              const formattedSunTime = formatTime(item.time, settings.timeFormat);
              const [timeDigits, ampm] = formattedSunTime.split(' ');
              
              return (
                <div
                  key={`sun-${item.event}-${item.time.toISOString()}`}
                  className="flex flex-col items-center gap-3 snap-start min-w-[3.5rem]"
                >
                  <span className="text-sm font-semibold text-foreground/50 capitalize">
                    {item.event}
                  </span>
                  <SunIcon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                  <div className="flex flex-col items-center leading-none">
                    <span className="text-lg font-medium tracking-tight font-mono">{timeDigits}</span>
                    {ampm && <span className="text-sm font-medium tracking-tight font-mono mt-2.5">{ampm}</span>}
                  </div>
                  <div className="h-4" />
                </div>
              );
            }

            const i = item.index;
            const timeStr = hourly.time[i];
            const hourDate = item.time;
            // Use API-provided is_day when available (hourly field added); fall back to current
            // 1. Move `isNow` up so we can evaluate it first
            const isNow = i === startIdx;

            // 2. Convert the API's 1 or 0 into a strict true/false boolean
            const apiIsDay = hourly.is_day ? hourly.is_day[i] === 1 : current.is_day === 1;

            // 3. OVERRIDE: If it's "Now", use our minute-accurate hook. Otherwise, trust the API.
            const isHourDay = isNow ? isDay : apiIsDay;

            const Icon = getWeatherIcon(hourly.weather_code[i], isHourDay ? 1 : 0);
            const temp = hourly.temperature_2m[i];
            const precip = hourly.precipitation_probability[i];

            return (
              <div key={timeStr} className="flex flex-col items-center gap-3 snap-start min-w-[3.5rem]">
                <span className="text-sm font-semibold text-foreground/80">
                  {isNow ? 'Now' : formatHourLabel(hourDate, settings.timeFormat)}
                </span>
                <Icon className="w-6 h-6 text-foreground/90" strokeWidth={1.5} />
                <span className="text-lg font-medium tracking-tight">{formatFelsiusValue(temp)}°</span>
                <div className="h-4 flex items-center justify-center">
                  {precip > 0 && (
                    <span className="text-xs font-bold text-sky-500">{precip}%</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7-Day Forecast */}
      <section className="glass-panel p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground/60 mb-2 border-b border-black/5 pb-3">
          <CalendarDays className="w-4 h-4" />
          <span>7-Day Forecast</span>
        </div>
        <div className="space-y-1">
          {daily.time.map((timeStr, i) => {
            const date = parseLocalDateString(timeStr);
            const dayName = i === 0 ? 'Today' : date.toLocaleDateString('en-GB', { weekday: 'short' });
            const Icon = getWeatherIcon(daily.weather_code[i], 1);
            const high = daily.temperature_2m_max[i];
            const low = daily.temperature_2m_min[i];
            const precip = daily.precipitation_probability_max[i];

            return (
              <DetailSheet key={timeStr} title="Conditions" icon={Cloud} trigger={
                <button className="flex items-center justify-between py-2 border-b border-black/5 last:border-0 w-full text-left active:opacity-70 transition-opacity">
                  <div className="w-16 font-semibold text-[15px]">{dayName}</div>
                  <div className="flex items-center gap-2 flex-1 justify-center">
                    <Icon className="w-5 h-5 text-foreground/80" strokeWidth={1.5} />
                    {precip > 20 ? (
                      <span className="text-xs font-bold text-sky-500 w-8 text-left">{precip}%</span>
                    ) : (
                      <span className="w-8" />
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-4 w-32">
                    <span className="text-[15px] font-semibold text-foreground/60 w-10 text-right">
                      {formatFelsius(low)}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-black/5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-sky-400 to-primary/80 opacity-50 rounded-full" />
                    </div>
                    <span className="text-[15px] font-semibold text-foreground w-10 text-right">
                      {formatFelsius(high)}
                    </span>
                  </div>
                </button>
              }>
                <DailyDetailContent daily={daily} hourly={hourly} initialDayIndex={i} />
              </DetailSheet>
            );
          })}
        </div>
      </section>

      {/* Grid of Cards */}
      <div className="grid grid-cols-2 gap-4">
        {airQuality && (
          <DetailSheet title="Air Quality" icon={WindIcon} trigger={
            <button className={CARD_TRIGGER_CLASS}>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground/60 mb-2">
                <WindIcon className="w-4 h-4" />
                <span>Air Quality</span>
              </div>
              {(() => {
                const band = getAqiBand(airQuality.us_aqi);
                const position = getAqiPosition(airQuality.us_aqi);
                return (
                  <div className="mt-auto space-y-4 pt-4">
                    <div className="space-y-1">
                      <div className="text-3xl font-medium tracking-tight">{Math.round(airQuality.us_aqi)}</div>
                      <div className="text-[15px] font-semibold leading-tight">{band.label}</div>
                    </div>
                    <div className="relative h-1.5 rounded-full bg-black/5 overflow-hidden">
                      <div
                        className="absolute inset-0"
                        style={{
                          background: 'linear-gradient(to right, rgb(34 197 94), rgb(234 179 8), rgb(249 115 22), rgb(239 68 68), rgb(168 85 247), rgb(136 19 55))',
                        }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-sm ring-1 ring-black/20"
                        style={{ left: `${Math.max(0, Math.min(98, position * 100))}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </button>
          }>
            <AirQualityDetailContent airQuality={airQuality} unit={(settings as any).airPollutionUnit || 'μg/m³'} />
          </DetailSheet>
        )}
{(() => { console.log("Sunrise:", new Date(sunrise).toLocaleTimeString(), "Sunset:", new Date(sunset).toLocaleTimeString()); return null; })()}
    <DetailSheet 
          title="Sunrise & Sunset" 
          icon={isDay ? Sunset : Sunrise} // Dynamic header icon
          trigger={
            <button className={CARD_TRIGGER_CLASS}>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground/60 mb-2">
                {/* Dynamic trigger icon */}
                {isDay ? <Sunset className="w-4 h-4" /> : <Sunrise className="w-4 h-4" />}
                <span>{isDay ? "Sunset" : "Sunrise"}</span>
              </div>
              <div className="mt-auto pt-4 space-y-4">
    {/* Add 'relative -top-2' to nudge it up without changing document flow */}
    <div className="text-3xl font-medium tracking-tight relative -top-1">
      {isSpecialSun 
      ? '>7 days' 
      : formatTime(isDay ? sunset : sunrise, settings.timeFormat)}
      </div>
    <div className="text-[15px] font-semibold text-foreground/80">
    <p className="text-sm text-foreground/60">
      {isDay ? "Sunrise: " : "Sunset: "} 
      {isSpecialSun ? '>7 days' : formatTime(isDay ? sunrise : sunset, settings.timeFormat)}
    </p>
   </div>
 </div>
            </button>
          }
        >
          <SunriseSunsetDetailContent
            current={current}
            daily={daily}
            latitude={location.latitude}
            longitude={location.longitude}
          />
        </DetailSheet>

        <DetailSheet title="Wind" icon={Wind} trigger={
          <button className={CARD_TRIGGER_CLASS}>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground/60 mb-2">
              <Wind className="w-4 h-4" />
              <span>Wind</span>
            </div>
            <div className="mt-auto pt-4 flex items-center justify-between">
              <div className="text-2xl sm:text-3xl font-medium tracking-tight font-mono">
                {convertWindSpeed(current.wind_speed_10m, settings.windUnit)}
                <span className="text-sm sm:text-base font-semibold text-foreground/60 ml-1 font-sans">
                  {windUnitLabel(settings.windUnit)}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center bg-black/5 shadow-inner">
                <Navigation
                  className="w-5 h-5 text-foreground/80"
                  style={{ transform: `rotate(${current.wind_direction_10m + 180 - 45}deg)` }}
                />
              </div>
            </div>
          </button>
        }>
          <WindDetailContent current={current} />
        </DetailSheet>

        <DetailSheet title="Feels Like" icon={Thermometer} trigger={
          <button className={CARD_TRIGGER_CLASS}>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground/60 mb-2">
              <Thermometer className="w-4 h-4" />
              <span>Feels Like</span>
            </div>
            <div className="mt-auto pt-4">
              <div className="text-3xl font-medium tracking-tight">
                {formatFelsiusValue(current.apparent_temperature)}°
              </div>
            </div>
          </button>
        }>
          <FeelsLikeDetailContent current={current} />
        </DetailSheet>

        <DetailSheet title="Humidity" icon={Droplets} trigger={
          <button className={CARD_TRIGGER_CLASS}>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground/60 mb-2">
              <Droplets className="w-4 h-4" />
              <span>Humidity</span>
            </div>
            <div className="mt-auto pt-4">
              <div className="text-3xl font-medium tracking-tight font-mono">
                {formatHumidity(current.relative_humidity_2m)}
              </div>
            </div>
          </button>
        }>
          <HumidityDetailContent current={current} />
        </DetailSheet>

        <DetailSheet title="Visibility" icon={Eye} trigger={
          <button className={CARD_TRIGGER_CLASS}>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground/60 mb-2">
              <Eye className="w-4 h-4" />
              <span>Visibility</span>
            </div>
            <div className="mt-auto pt-4">
              <div className="text-3xl font-medium tracking-tight font-mono">
                {formatVisibility(current.visibility, settings.distanceUnit).split(' ')[0]}
                <span className="text-base font-semibold text-foreground/60 ml-1 font-sans">
                  {settings.distanceUnit}
                </span>
              </div>
            </div>
          </button>
        }>
          <VisibilityDetailContent current={current} />
        </DetailSheet>

        <DetailSheet title="Pressure" icon={Gauge} trigger={
          <button className={`${CARD_TRIGGER_CLASS} col-span-2 sm:col-span-1`}>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground/60 mb-2">
              <Gauge className="w-4 h-4" />
              <span>Pressure</span>
            </div>
            <div className="mt-auto pt-4">
              <div className="text-3xl font-medium tracking-tight font-mono">
                {convertPressure(current.pressure_msl, settings.pressureUnit)}
                <span className="text-base font-semibold text-foreground/60 ml-1 font-sans">
                  {pressureUnitLabel(settings.pressureUnit)}
                </span>
              </div>
            </div>
          </button>
        }>
          <PressureDetailContent current={current} hourly={hourly} />
        </DetailSheet>
      </div>
    </div>
  );
}