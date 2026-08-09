import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import type { DailyForecast, HourlyForecast } from '@/lib/weather-api';
import { getWeatherIcon } from '@/lib/weather-icons';
import { describeWeatherCode } from '@/lib/weather-api';
import { formatFelsius, formatFelsiusValue, FELSIUS_UNIT, formatTime, formatPrecipitation } from '@/lib/units';
import { parseLocalDateString, formatLongDate } from '@/lib/date-utils';
import { useSettings } from '@/lib/use-settings';
import { getDominantDaytimeCode, isPrecipitationCode } from '@/lib/weather-helpers';

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type DayPoint = {
  hourLabel: string;
  hour: number;
  actual: number;
  feels: number;
  precip: number;
  precipAmount: number;
};

export function DailyDetailContent({
  daily,
  hourly,
  initialDayIndex,
  current,
  dominantCode,
}: {
  daily: DailyForecast;
  hourly: HourlyForecast;
  initialDayIndex: number;
  current: any;
  dominantCode?: number;
}) {
  const [selectedDay, setSelectedDay] = useState(initialDayIndex);
  const [mode, setMode] = useState<'actual' | 'feels'>('actual');
  const { settings } = useSettings();

  const selectedDate = parseLocalDateString(daily.time[selectedDay]);
  const dateHeading = formatLongDate(selectedDate, settings.longDateFormat);

  const dayHours = useMemo<DayPoint[]>(() => {
    const dateStr = daily.time[selectedDay];
    const pts: DayPoint[] = [];
    hourly.time.forEach((t, i) => {
      if (!t.startsWith(dateStr)) return;
      const hour = Number(t.slice(11, 13));
      pts.push({
        hourLabel: (() => {
          const d = new Date(selectedDate);
          d.setHours(hour, 0, 0, 0);
          return formatTime(d, settings.timeFormat);
        })(),
        hour,
        actual: formatFelsiusValue(hourly.temperature_2m[i]),
        feels: formatFelsiusValue(hourly.apparent_temperature[i]),
        precip: hourly.precipitation_probability[i],
        precipAmount: hourly.precipitation[i],
      });
    });
    return pts.sort((a, b) => a.hour - b.hour);
  }, [daily.time, hourly, selectedDay, selectedDate, settings.timeFormat]);

  const activeKey = mode === 'actual' ? 'actual' : 'feels';
  const highPoint = dayHours.length
    ? dayHours.reduce((b, p) => (p[activeKey] > b[activeKey] ? p : b))
    : null;
  const lowPoint = dayHours.length
    ? dayHours.reduce((b, p) => (p[activeKey] < b[activeKey] ? p : b))
    : null;

  const dailyTotal = dayHours.reduce((sum, point) => sum + point.precipAmount, 0);

  const actualHigh = daily.temperature_2m_max[selectedDay];
  const actualLow = daily.temperature_2m_min[selectedDay];
  const feelsHigh = dayHours.length ? Math.max(...dayHours.map((p) => p.feels)) : formatFelsiusValue(actualHigh);
  const feelsLow = dayHours.length ? Math.min(...dayHours.map((p) => p.feels)) : formatFelsiusValue(actualLow);

  const displayHigh = mode === 'actual' ? formatFelsius(actualHigh) : `${feelsHigh}${FELSIUS_UNIT}`;
  const displayLow = mode === 'actual' ? formatFelsius(actualLow) : `${feelsLow}${FELSIUS_UNIT}`;

  const isToday = selectedDay === 0;
  const isMidnightSun = daily.daylight_duration[0] > 86340;
  const detailsIsDay = isToday ? (isMidnightSun ? 1 : current?.is_day ?? 1) : 1;
  
  // Determine displayCode: use the passed dominantCode for Today, or calculate for future days
    let displayCode: number;
    if (selectedDay === 0 && dominantCode !== undefined) {
      displayCode = dominantCode;
    } else if (selectedDay === 0) {
      // Safe fallback if dominantCode isn't passed
      const rawCurrentCode = current?.weather_code ?? 3;
      displayCode = rawCurrentCode;
    } else {
      displayCode = getDominantDaytimeCode(hourly, daily, daily.time[selectedDay]);
    }

    const Icon = getWeatherIcon(displayCode, detailsIsDay);
    const precipChance = daily.precipitation_probability_max[selectedDay];

    const formatTooltipTime = (rawHour: number) => {
      const d = new Date(selectedDate);
      d.setHours(rawHour, 0, 0, 0);
      return formatTime(d, settings.timeFormat);
    };

  const CustomPrecipTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DayPoint;
      return (
        <div style={{
          background: 'hsl(var(--background))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '0.75rem',
          padding: '12px 14px',
        }} className="shadow-sm flex flex-col gap-1">
          <p className="text-foreground text-[15px] mb-1">{formatTooltipTime(data.hour)}</p>
          <p style={{ color: 'hsl(var(--primary))' }} className="font-medium text-sm">
            {`Chance : ${data.precip}%`}
          </p>
          <p style={{ color: 'hsl(210, 100%, 50%)' }} className="font-medium text-sm">
            {`Amount : ${formatPrecipitation(data.precipAmount, settings.precipitationUnit)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-7 gap-1">
        {daily.time.map((dateStr, i) => {
          const date = parseLocalDateString(dateStr);
          const isSelected = i === selectedDay;
          const isTodayTab = i === 0;
          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDay(i)}
              className="flex flex-col items-center gap-1.5 py-1 rounded-xl transition-colors"
            >
              <span className={`text-[11px] font-bold uppercase ${isTodayTab && !isSelected ? 'text-primary' : 'text-foreground/40'}`}>
                {WEEKDAY_LETTERS[date.getDay()]}
              </span>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${isSelected ? 'bg-primary text-primary-foreground' : 'text-foreground/80'}`}>
                {date.getDate()}
              </span>
            </button>
          );
        })}
      </div>
      <div className="text-center text-sm font-semibold text-foreground/70">{dateHeading}</div>

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-medium tracking-tight">{displayHigh}</span>
            <span className="text-xl font-medium text-foreground/50">{displayLow}</span>
          </div>
          <div className="text-sm font-semibold text-foreground/60">
            {mode === 'actual'
              ? `${describeWeatherCode(displayCode)} · Felsius (${FELSIUS_UNIT})`
              : `Feels Like · Felsius (${FELSIUS_UNIT})`}
          </div>
        </div>
        <Icon className="w-10 h-10 text-primary" strokeWidth={1.5} />
      </div>

      <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-black/5">
        <button
          onClick={() => setMode('actual')}
          className={`py-2 rounded-full text-sm font-semibold transition-colors ${mode === 'actual' ? 'bg-background shadow-sm' : 'text-foreground/50'}`}
        >
          Actual
        </button>
        <button
          onClick={() => setMode('feels')}
          className={`py-2 rounded-full text-sm font-semibold transition-colors ${mode === 'feels' ? 'bg-background shadow-sm' : 'text-foreground/50'}`}
        >
          Feels Like
        </button>
      </div>
      <p className="text-xs text-foreground/50 -mt-2">
        {mode === 'actual'
          ? 'The actual temperature.'
          : 'What the temperature feels like, accounting for wind and humidity.'}
      </p>

      <div className="glass-panel p-4 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dayHours} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="dailyActualFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="dailyFeelsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="hourLabel"
              tickLine={false}
              axisLine={false}
              interval={5}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
            hide 
            domain={[
                (dataMin: number) => Math.floor(dataMin - 3), 
                (dataMax: number) => Math.ceil(dataMax + 3)
              ]} 
            />
            <Tooltip
              formatter={(value: number, name: string): [string, string] => [
                `${value}${FELSIUS_UNIT}`,
                name === 'actual' ? 'Actual' : 'Feels Like',
              ]}
              labelFormatter={(label, payload) => {
                if (payload && payload.length > 0) {
                  const rawHour = payload[0].payload.hour;
                  return formatTooltipTime(rawHour);
                }
                return label;
              }}
              contentStyle={{
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.75rem',
              }}
            />

            {mode === 'feels' && (
              <Area
                type="monotone"
                dataKey="actual"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5}
                strokeOpacity={0.5}
                fill="none"
                dot={false}
                isAnimationActive={false}
                baseValue="dataMin"
              />
            )}

            <Area
              type="monotone"
              dataKey={mode === 'actual' ? 'actual' : 'feels'}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill={mode === 'actual' ? 'url(#dailyActualFill)' : 'url(#dailyFeelsFill)'}
              baseValue="dataMin"
            />

            {highPoint && (
              <ReferenceDot
                x={highPoint.hourLabel}
                y={highPoint[activeKey]}
                r={4}
                fill="hsl(var(--primary))"
                stroke="white"
                strokeWidth={2}
                label={{ value: 'H', position: 'top', fontSize: 11, fontWeight: 700 }}
              />
            )}
            {lowPoint && (
              <ReferenceDot
                x={lowPoint.hourLabel}
                y={lowPoint[activeKey]}
                r={4}
                fill="hsl(var(--muted-foreground))"
                stroke="white"
                strokeWidth={2}
                label={{ value: 'L', position: 'top', fontSize: 11, fontWeight: 700 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <div className="text-lg font-semibold">Precipitation</div>
          {dailyTotal > 0 && (
            <div className="text-sm font-semibold" style={{ color: 'hsl(210, 100%, 50%)' }}>
              Total: {formatPrecipitation(dailyTotal, settings.precipitationUnit)}
            </div>
          )}
        </div>
        <div className="text-sm text-foreground/60 mb-3">
          {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}&apos;s chance: {Math.round(precipChance)}%
        </div>
        <div className="glass-panel p-4 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dayHours} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="hourLabel"
                tickLine={false}
                axisLine={false}
                interval={5}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis hide domain={[0, 100]} />
              <Tooltip 
                content={<CustomPrecipTooltip />} 
                cursor={{ fill: 'hsl(var(--foreground) / 0.05)' }} 
              />
              <Bar dataKey="precip" fill="hsl(var(--primary) / 0.67)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="precipAmount" fill="hsl(210, 100%, 50%)" radius={[2, 2, 0, 0]} barSize={6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}