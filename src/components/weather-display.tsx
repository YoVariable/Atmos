import { useWeather, useAirQuality } from '@/lib/use-weather';
import { describeWeatherCode } from '@/lib/weather-api';
import { getWeatherIcon, getWeatherColor } from '@/lib/weather-icons';
import { getAqiBand, getAqiPosition } from '@/lib/aqi';
import { generateNotices, generateAqiNotice, type WeatherNotice } from '@/lib/alerts';
import { useDayNight } from '@/lib/use-day-night';
import * as SunCalc from 'suncalc';
import { UVIndexDetailContent } from '@/components/uv-index-detail-content';
import { Sun } from 'lucide-react';
import { getUvCategory } from "@/lib/utils";

import { calculateBarMetrics, getDominantDaytimeCode, getTodayEffectiveCode, getFelsiusBarGradient, isPrecipitationCode } from '@/lib/weather-helpers';

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
  formatPressureValue,
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
import { useEffect, useState } from 'react';
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
  const [showSettings, setShowSettings] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const { data: airQualityData } = useAirQuality(location.latitude, location.longitude);

  const currentHour = new Intl.DateTimeFormat('en-US', {
    timeZone: airQualityData?.timezone,
    hour: 'numeric',
    hourCycle: 'h23',
  }).format(new Date());

  const nowIndex = airQualityData?.hourly?.time?.findIndex(
    (t) => parseInt(t.split('T')[1].split(':')[0]) === parseInt(currentHour)
  ) ?? 0;

  const currentUvValue = airQualityData?.hourly?.uv_index?.[nowIndex] ?? 0;

  const getFormattedDate = (date: Date) => {
    if (settings.longDateFormat === 'dmy') {
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }
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
  const effectiveIsDay = isDay ? 1 : 0;

  const { data: airQuality } = useAirQuality(location.latitude, location.longitude);

  useEffect(() => {
    if (isActive && data?.current) {
      const isMidnightSun = data.daily.daylight_duration[0] > 86340;
      const isDayFlag = (isMidnightSun || data.current.is_day === 1) ? 1 : 0;
      const color = getWeatherColor(displayCode, isDayFlag);
      const glow = document.getElementById('ambient-glow');
      if (glow) glow.style.backgroundColor = color;
    }
  }, [data?.current?.weather_code, data?.current?.is_day, data?.daily?.daylight_duration, isActive]);

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

  const globalMin = Math.min(...daily.temperature_2m_min);
  const globalMax = Math.max(...daily.temperature_2m_max);

  const notices: WeatherNotice[] = [
    ...generateNotices(current, daily),
    ...(airQuality
      ? [generateAqiNotice(airQuality.us_aqi)].filter((n): n is WeatherNotice => n !== null)
      : []),
  ];

  const sunrise = new Date(daily.sunrise[0]);
  const sunset = new Date(daily.sunset[0]);
  const currentCityTime = new Date(current.time).getTime();

  const todayHigh = daily.temperature_2m_max[0];
  const todayLow = daily.temperature_2m_min[0];

  const isPolarNight = daily.daylight_duration[0] < 60;
  const isMidnightSun = daily.daylight_duration[0] > 86340;
  const isSpecialSun = isPolarNight || isMidnightSun;

  // Determine card primary preview order for extreme latitudes vs standard days
  const showSunsetPrimary = isMidnightSun || (!isPolarNight && isDay);

  const currentHourStartMs = new Date(current.time).setHours(new Date(current.time).getHours(), 0, 0, 0);
  let startIdx = hourly.time.findIndex((t) => new Date(t).getTime() >= currentHourStartMs);
  if (startIdx === -1) startIdx = 0;
  const displayCode = getTodayEffectiveCode(hourly, current, startIdx);
  const windowSize = 24;
  const endIdx = Math.min(hourly.time.length, startIdx + windowSize);

  type TimelineItem =
    | { kind: 'hour'; time: Date; index: number }
    | { kind: 'sun'; time: Date; event: 'sunrise' | 'sunset' };

  const timeline: TimelineItem[] = [];
  for (let i = startIdx; i < endIdx; i++) {
    timeline.push({ kind: 'hour', time: new Date(hourly.time[i]), index: i });
  }

  if (!isSpecialSun) {
    const windowStart = new Date(hourly.time[startIdx]).getTime();
    const windowEnd = new Date(hourly.time[endIdx - 1]).getTime();
    daily.sunrise.forEach((s) => {
      const t = new Date(s).getTime();
      if (t >= windowStart && t <= windowEnd && t > currentCityTime) {
        timeline.push({ kind: 'sun', time: new Date(s), event: 'sunrise' });
      }
    });

    daily.sunset.forEach((s) => {
      const t = new Date(s).getTime();
      if (t >= windowStart && t <= windowEnd && t > currentCityTime) {
        timeline.push({ kind: 'sun', time: new Date(s), event: 'sunset' });
      }
    });
  }
  timeline.sort((a, b) => a.time.getTime() - b.time.getTime());

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
          {describeWeatherCode(displayCode)}
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
            const isNow = i === startIdx;

            const apiIsDay = isSpecialSun || (hourly.is_day ? hourly.is_day[i] === 1 : current.is_day === 1);
            const isHourDay = isSpecialSun || (isNow ? isDay : apiIsDay);

            const precipAmount = hourly.precipitation ? hourly.precipitation[i] : 0;
            const hasMeasurableRain = precipAmount >= 0.2;

            const rawWeatherCode = hourly.weather_code[i];
            let effectiveWeatherCode = rawWeatherCode;

            if ((!hasMeasurableRain && isPrecipitationCode(rawWeatherCode)) ||
                (precipAmount >= 0.2 && (rawWeatherCode === 0 || rawWeatherCode === 1))) {
              effectiveWeatherCode = 3;
            }

            const Icon = getWeatherIcon(effectiveWeatherCode, isHourDay ? 1 : 0);

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
                  {precip > 0 && hasMeasurableRain && (
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

          // Extract the WMO code for day `i` instead of using the top-level `displayCode`
          const dayCode = daily.weather_code?.[i] ?? daily.weather_code?.[i] ?? displayCode;
          const effectiveDayFlag = (i === 0 && isSpecialSun) ? 1 : (i === 0 ? current.is_day : 1);
          const Icon = getWeatherIcon(dayCode, effectiveDayFlag);

          const high = daily.temperature_2m_max[i];
          const low = daily.temperature_2m_min[i];
          const precip = daily.precipitation_probability_max[i];

          const isToday = i === 0;
          const { leftPercent, widthPercent, showCurrentDot, dotPercent } = calculateBarMetrics(
            low,
            high,
            globalMin,
            globalMax,
            isToday,
            current.temperature_2m
          );

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
                <div className="flex items-center justify-end gap-4 w-48">
                  <span className="text-[15px] font-semibold text-foreground/60 w-10 text-right">
                    {formatFelsius(low)}
                  </span>

                  <div className="flex-1 h-1.5 rounded-full bg-black/10 dark:bg-white/10 relative">
                    <div
                      className="absolute h-full rounded-full"
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                        background: getFelsiusBarGradient(low, high),
                      }}
                    >
                      {showCurrentDot && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-md border border-black/20 z-10"
                          style={{ left: `${dotPercent}%` }}
                        />
                      )}
                    </div>
                  </div>

                  <span className="text-[15px] font-semibold text-foreground w-10 text-right">
                    {formatFelsius(high)}
                  </span>
                </div>
              </button>
            }>
              <DailyDetailContent daily={daily} hourly={hourly} initialDayIndex={i} current={data.current} dominantCode={dayCode} />
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
                  <div className="mt-auto space-y-4 pt-4 w-full"> {/* Added w-full here */}
                    <div className="space-y-1">
                      <div className="text-3xl font-medium tracking-tight">{Math.round(airQuality.us_aqi)}</div>
                      <div className="text-[15px] font-semibold leading-tight">{band.label}</div>
                    </div>
                    <div className="relative h-1.5 rounded-full bg-black/5 overflow-hidden w-full"> {/* Added w-full here */}
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
          <AirQualityDetailContent 
            airQuality={airQuality} 
            current={current} 
            gasUnit={(settings as any).airPollutionUnit ?? 'μg/m³'}
            pmUnit={(settings as any).particulatePollutionUnit ?? 'μg/m³'} 
          />
          </DetailSheet>
        )}

        <DetailSheet 
          title="Sunrise & Sunset" 
          icon={showSunsetPrimary ? Sunset : Sunrise}
          trigger={
            <button className={CARD_TRIGGER_CLASS}>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground/60 mb-2">
                {showSunsetPrimary ? <Sunset className="w-4 h-4" /> : <Sunrise className="w-4 h-4" />}
                <span>{showSunsetPrimary ? "Sunset" : "Sunrise"}</span>
              </div>
              <div className="mt-auto pt-4 space-y-4">
                <div className="text-3xl font-medium tracking-tight relative -top-1">
                  {isSpecialSun 
                  ? '>7 days' 
                  : formatTime(showSunsetPrimary ? sunset : sunrise, settings.timeFormat)}
                </div>
                <div className="text-[15px] font-semibold text-foreground/80">
                  <p className="text-sm text-foreground/60">
                    {showSunsetPrimary ? "Sunrise: " : "Sunset: "} 
                    {isSpecialSun ? '>7 days' : formatTime(showSunsetPrimary ? sunrise : sunset, settings.timeFormat)}
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
            {/* Added w-full and justify-between to lock the edges */}
            <div className="mt-auto pt-4 flex items-center justify-between w-full"> 
              <div className="text-2xl sm:text-3xl font-medium tracking-tight font-mono">
                {convertWindSpeed(current.wind_speed_10m, settings.windUnit)}
                <span className="text-sm sm:text-base font-semibold text-foreground/60 ml-1 font-sans">
                  {windUnitLabel(settings.windUnit)}
                </span>
              </div>
                <div className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center bg-black/5 shadow-inner shrink-0 relative">
                <svg
                  className="w-5 h-5 text-foreground/80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: `rotate(${current.wind_direction_10m + 180}deg)`,
                  }}
                >
                  <polygon points="12 2 19 21 12 17 5 21 12 2" />
                </svg>
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

        <DetailSheet 
          title="UV Index" 
          icon={Sun} 
          trigger={
            <button className={CARD_TRIGGER_CLASS}>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground/60 mb-2">
                <Sun className="w-4 h-4" />
                <span>UV Index</span>
              </div>

              <div className="mt-auto pt-4">
                <div className="text-3xl font-medium tracking-tight font-mono">
                  {Math.round(currentUvValue)}
                </div>
                <div className="text-sm text-foreground/70 font-medium mt-1">
                  {getUvCategory(currentUvValue)}
                </div>
              </div>
              
              <div className="relative w-full h-1.5 rounded-full mt-4 bg-gradient-to-r from-green-400 via-yellow-400 to-purple-500 opacity-80">
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_4px_rgba(0,0,0,0.3)] border-2 border-white/50"
                  style={{ left: `${Math.min((currentUvValue / 11) * 100, 100)}%` }}
                />
              </div>
            </button>
          }
        >
          <UVIndexDetailContent 
            hourly={airQualityData?.hourly} 
            initialDayIndex={0} 
            timezone={airQualityData?.timezone} 
          />
        </DetailSheet>

        <DetailSheet title="Humidity" icon={Droplets} trigger={
          <button className={`${CARD_TRIGGER_CLASS} justify-start gap-4 pb-4`}>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground/60 mb-2">
              <Droplets className="w-4 h-4" />
              <span>Humidity</span>
            </div>
            <div className="mt-0">
              <div className="text-3xl font-medium tracking-tight font-mono">
                {formatHumidity(current.relative_humidity_2m)}
              </div>
              <div className="text-sm text-foreground/60 mt-5 font-semibold">
                Dew Point: {formatFelsius(current.dew_point_2m)}
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
                {formatPressureValue(current.pressure_msl, settings.pressureUnit)}
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