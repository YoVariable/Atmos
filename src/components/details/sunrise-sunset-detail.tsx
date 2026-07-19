import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import type { CurrentWeather, DailyForecast } from '@/lib/weather-api';
import { formatTime } from '@/lib/units';
import { getMonthlySunlight, getSunProgress } from '@/lib/solar';
import { parseLocalDateString } from '@/lib/date-utils';
import { useSettings } from '@/lib/use-settings';

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

/** Short date: "Jul 23" (mdy) or "23 Jul" (dmy). */
function formatShortDate(dateStr: string, fmt: 'mdy' | 'dmy'): string {
  const date = parseLocalDateString(dateStr);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return fmt === 'mdy' ? `${month} ${day}` : `${day} ${month}`;
}

/** True if an Open-Meteo sunrise/sunset string is the midnight sentinel (00:00 local). */
function isMidnightSentinel(isoStr: string): boolean {
  const d = new Date(isoStr);
  return d.getHours() === 0 && d.getMinutes() === 0;
}

/** Find the first non-sentinel sunrise in the forecast array. */
function findNextRealSunrise(daily: DailyForecast): { date: Date; dateStr: string } | null {
  for (let i = 0; i < daily.sunrise.length; i++) {
    if (!isMidnightSentinel(daily.sunrise[i])) {
      return { date: new Date(daily.sunrise[i]), dateStr: daily.time[i] };
    }
  }
  return null;
}

function SunArc({ progress, isDaytime }: { progress: number; isDaytime: boolean }) {
  const cx = 150, cy = 120, r = 110;
  const t = Math.min(1, Math.max(0, progress));
  const angleDeg = 180 - 180 * t;
  const angleRad = (angleDeg * Math.PI) / 180;
  const sunX = cx + r * Math.cos(angleRad);
  const sunY = cy - r * Math.sin(angleRad);

  return (
    <svg viewBox="0 0 300 140" className="w-full h-auto">
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="4 6"
        className="text-foreground/15"
      />
      <line x1={cx - r - 10} y1={cy} x2={cx + r + 10} y2={cy}
        stroke="currentColor" strokeWidth="1.5" className="text-foreground/20" />
      {isDaytime && <circle cx={sunX} cy={sunY} r="9" className="fill-primary" />}
    </svg>
  );
}

export function SunriseSunsetDetailContent({
  current,
  daily,
  latitude,
  longitude,
}: {
  current: CurrentWeather;
  daily: DailyForecast;
  latitude: number;
  longitude: number;
}) {
  const { settings } = useSettings();
  const now = new Date(current.time);
  const sunrise = new Date(daily.sunrise[0]);
  const sunset = new Date(daily.sunset[0]);

  // Polar night: sun never rises (<1 min daylight). Midnight sun: never sets (>23h59m).
  const isPolarNight = daily.daylight_duration[0] < 60;
  const isMidnightSun = daily.daylight_duration[0] > 86340;
  const isSpecialSun = isPolarNight || isMidnightSun;

  const progress = isSpecialSun
    ? (isMidnightSun ? 0.5 : 0)
    : getSunProgress(now, sunrise, sunset);
  const isDaytime = isMidnightSun ? true : (!isPolarNight && now >= sunrise && now <= sunset);

  const daylightMinutes = daily.daylight_duration[0] / 60;
  const daylightHours = Math.floor(daylightMinutes / 60);
  const daylightRemMinutes = Math.round(daylightMinutes % 60);

  // Countdown / special message
  let countdownLabel = '';
  if (isMidnightSun) {
    countdownLabel = 'No sunset today.';
  } else if (isPolarNight) {
    const next = findNextRealSunrise(daily);
    countdownLabel = next
      ? `Sunrise on ${formatShortDate(next.dateStr, settings.longDateFormat)}`
      : 'No sunrise today.';
  } else if (isDaytime) {
    countdownLabel = `Sets in ${formatDuration(sunset.getTime() - now.getTime())}`;
  } else if (now < sunrise) {
    countdownLabel = `Rises in ${formatDuration(sunrise.getTime() - now.getTime())}`;
  } else if (daily.sunrise[1]) {
    const nextSunrise = new Date(daily.sunrise[1]);
    countdownLabel = `Rises in ${formatDuration(nextSunrise.getTime() - now.getTime())}`;
  }

  const year = now.getFullYear();
  const monthly = getMonthlySunlight(latitude, longitude, year);
  const currentMonth = now.getMonth();
  const chartData = monthly.map((m) => ({
    month: MONTH_LABELS[m.month],
    hours: Math.round(m.daylightHours * 10) / 10,
  }));
  const currentPoint = chartData[currentMonth];

  const sunriseLabel = isSpecialSun ? '>7 days' : formatTime(sunrise, settings.timeFormat);
  const sunsetLabel  = isSpecialSun ? '>7 days' : formatTime(sunset,  settings.timeFormat);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <SunArc progress={progress} isDaytime={isDaytime} />
        <div className="flex items-center justify-between text-center">
          <div className="flex-1">
            <div className="text-xs font-semibold uppercase tracking-widest text-foreground/50">Sunrise</div>
            <div className="text-2xl font-medium tracking-tight font-mono">{sunriseLabel}</div>
          </div>
          <div className="flex-1">
            {countdownLabel && (
              <div className="text-sm font-semibold text-foreground/70">{countdownLabel}</div>
            )}
            {!isSpecialSun && (
              <div className="text-xs text-foreground/50 mt-1">
                {daylightHours}h {daylightRemMinutes}m of daylight
              </div>
            )}
            {isPolarNight && (
              <div className="text-xs text-foreground/50 mt-1">Polar night</div>
            )}
            {isMidnightSun && (
              <div className="text-xs text-foreground/50 mt-1">Midnight sun</div>
            )}
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold uppercase tracking-widest text-foreground/50">Sunset</div>
            <div className="text-2xl font-medium tracking-tight font-mono">{sunsetLabel}</div>
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-foreground/50 mb-3">
          Monthly Daylight Averages
        </div>
        <div className="glass-panel p-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="daylightFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tickLine={false} axisLine={false} interval={1}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
              <Tooltip
                formatter={(value: number) => [`${value}h`, 'Daylight']}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                contentStyle={{
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.75rem',
                }}
              />
              <Area type="monotone" dataKey="hours" stroke="hsl(var(--primary))"
                strokeWidth={2} fill="url(#daylightFill)" />
              {currentPoint && (
                <ReferenceDot x={currentPoint.month} y={currentPoint.hours}
                  r={5} fill="hsl(var(--primary))" stroke="white" strokeWidth={2} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-foreground/50 mt-2 leading-relaxed">
          Estimated daylight length across the year for this location. The longest day falls
          around the summer solstice.
        </p>
      </div>
    </div>
  );
}
