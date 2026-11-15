import { Area, AreaChart, ResponsiveContainer, YAxis, Tooltip, CartesianGrid, XAxis, ReferenceLine } from 'recharts';
import { useSettings } from '@/lib/use-settings';

interface UVIndexDetailContentProps {
  hourly?: { 
    uv_index: number[];
    time: string[];
  };
  timezone?: string;
  initialDayIndex?: number; 
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: number | string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  const { settings } = useSettings();
  const { timeFormat } = settings;

  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const hourForLabel = typeof label === 'number'
    ? label
    : (typeof label === 'string' && /^\d+$/.test(label) ? parseInt(label, 10) : 0);

  const displayLabel = timeFormat === '12h'
    ? new Date(2026, 0, 1, hourForLabel).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    : `${hourForLabel.toString().padStart(2, '0')}:00`;

  return (
    <div className="bg-background py-3 px-3 border border-border rounded-[10px] shadow-sm text-sm flex flex-col gap-1">
      <p className="text-foreground text-[16px]">{displayLabel}</p>
      <p style={{ color: 'hsl(var(--primary))' }} className="font-medium text-base">
        {`UV Index : ${payload[0].value.toFixed(2)}`}
      </p>
    </div>
  );
}

type UVPoint = { time: number; value: number | null };
type UVWindow = { startHour: number; endHour: number };

// Keep separate elevated periods separate, and retain a single qualifying hour.
function getUvWindows(dayData: UVPoint[]): UVWindow[] {
  const windows: UVWindow[] = [];
  let lastElevatedHour: number | null = null;

  for (const { time, value } of dayData) {
    if (value === null || value < 3) {
      lastElevatedHour = null;
      continue;
    }

    const lastWindow = windows[windows.length - 1];
    if (lastWindow && lastElevatedHour !== null && time === lastElevatedHour + 1) {
      lastWindow.endHour = time;
    } else {
      windows.push({ startHour: time, endHour: time });
    }
    lastElevatedHour = time;
  }

  return windows;
}

function uvHourLabel(hour: number, timeFormat: string): string {
  if (timeFormat === '24h') return `${String(hour).padStart(2, '0')}:00`;
  return new Date(2026, 0, 1, hour).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function describeUvWindows(windows: UVWindow[], timeFormat: string): string {
  const periods = windows.map(({ startHour, endHour }) =>
    startHour === endHour
      ? `at ${uvHourLabel(startHour, timeFormat)}`
      : `from ${uvHourLabel(startHour, timeFormat)} through ${uvHourLabel(endHour, timeFormat)}`
  );

  if (periods.length <= 1) return periods[0] ?? '';
  if (periods.length === 2) return `${periods[0]} and ${periods[1]}`;
  return `${periods.slice(0, -1).join(', ')}, and ${periods[periods.length - 1]}`;
}

// Generate one complete message, so the current-condition advice and forecast
// window don't repeat each other or misrepresent forecast data as observations.
function getUvDescription(
  dayData: UVPoint[], currentHour: number, isCurrentDay: boolean, timeFormat: string
): string {
  const availableCount = dayData.filter(({ value }) => value !== null).length;
  if (availableCount === 0) return 'UV forecast data are unavailable for this day.';

  const hasMissingHours = availableCount < dayData.length;
  const missingNote = hasMissingHours ? ' Some hourly UV readings are unavailable.' : '';
  const windows = getUvWindows(dayData);
  const currentUvValue = isCurrentDay
    ? (dayData.find(({ time }) => time === currentHour)?.value ?? null)
    : null;

  if (windows.length === 0) {
    if (hasMissingHours) {
      const prefix = isCurrentDay && currentUvValue === null
        ? 'Current UV data are unavailable. '
        : '';
      return `${prefix}Available hourly UV forecasts show values below 3.${missingNote}`;
    }
    if (!isCurrentDay) return 'UV levels are forecast to remain low (below 3) throughout the day.';
    if (currentUvValue === null) {
      return 'Current UV data are unavailable. The hourly forecast otherwise shows low UV (below 3) throughout the day.';
    }
    if (currentUvValue === 0) {
      return 'UV exposure is currently negligible, with levels forecast to remain below 3 throughout the day.';
    }
    return 'UV levels are currently low and forecast to remain below 3 throughout the day.';
  }

  const fullWindowText = describeUvWindows(windows, timeFormat);
  if (!isCurrentDay) {
    return `UV Index values of 3 or higher are forecast ${fullWindowText}.${missingNote}`;
  }

  const currentAdvice = currentUvValue === null
    ? 'Current UV data are unavailable. '
    : currentUvValue >= 3
      ? 'Sun protection is recommended. '
      : currentUvValue === 0
        ? 'UV exposure is currently negligible. '
        : 'UV levels are currently low. ';

  const lastWindow = windows[windows.length - 1];
  if (currentHour > lastWindow.endHour) {
    return `${currentAdvice}Earlier today, UV Index values of 3 or higher were forecast ${fullWindowText}.${missingNote}`;
  }

  const activeIndex = windows.findIndex(
    ({ startHour, endHour }) => currentHour >= startHour && currentHour <= endHour
  );
  if (activeIndex !== -1 && currentUvValue !== null && currentUvValue >= 3) {
    const activeWindow = windows[activeIndex];
    const activeText = activeWindow.startHour === activeWindow.endHour
      ? `A UV Index of 3 or higher is forecast at ${uvHourLabel(activeWindow.startHour, timeFormat)}.`
      : `Elevated UV is forecast through ${uvHourLabel(activeWindow.endHour, timeFormat)}.`;
    const laterWindows = windows.slice(activeIndex + 1);
    const laterText = laterWindows.length > 0
      ? ` Additional elevated UV is forecast ${describeUvWindows(laterWindows, timeFormat)}.`
      : '';
    return `${currentAdvice}${activeText}${laterText}${missingNote}`;
  }

  // Before the first period, or in a low-UV gap between elevated periods.
  const upcomingWindows = windows.filter(({ startHour }) => startHour > currentHour);
  if (upcomingWindows.length > 0) {
    return `${currentAdvice}UV Index values of 3 or higher are forecast ${describeUvWindows(upcomingWindows, timeFormat)}.${missingNote}`;
  }

  return `${currentAdvice}The hourly forecast shows UV Index values of 3 or higher ${fullWindowText}.${missingNote}`;
}

export function UVIndexDetailContent({ hourly, initialDayIndex, timezone }: UVIndexDetailContentProps) {
  const { settings } = useSettings();
  const { timeFormat } = settings;
  const dayIndex = initialDayIndex ?? 0;
  const isCurrentDay = dayIndex === 0;
  const startIndex = dayIndex * 24;

  const dayData: UVPoint[] = Array.from({ length: 24 }).map((_, i) => {
    const idx = startIndex + i;
    const timeStr = hourly?.time?.[idx];

    let hour = i;
    if (timeStr) {
      const parsedHour = Number(timeStr.split('T')[1]?.split(':')[0]);
      if (Number.isInteger(parsedHour) && parsedHour >= 0 && parsedHour <= 23) {
        hour = parsedHour;
      }
    }

    const rawValue = hourly?.uv_index?.[idx];
    // Missing or invalid values must not be treated as genuine zero UV readings.
    const value = typeof rawValue === 'number' && Number.isFinite(rawValue) && rawValue >= 0
      ? rawValue
      : null;
    return { time: hour, value };
  });

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    hour: 'numeric',
    hourCycle: 'h23',
  });
  const currentHour = parseInt(formatter.format(new Date()), 10);
  const nowIndex = isCurrentDay
    ? dayData.findIndex((item) => item.time === currentHour)
    : -1;

  const uvDescription = getUvDescription(dayData, currentHour, isCurrentDay, timeFormat);

  // Calculate maximum UV value for the day to dynamically scale gradient stops
  const maxUv = Math.max(...dayData.map(d => d.value ?? 0), 1);


  const yAxisStep =
    maxUv <= 12 ? 4 :
    maxUv <= 20 ? 5 :
    maxUv <= 50 ? 10 : 20;

  const yAxisMax = maxUv <= 12
    ? 12
    : Math.ceil((maxUv + 1) / yAxisStep) * yAxisStep;

  const yAxisTicks = Array.from(
    { length: yAxisMax / yAxisStep + 1 },
    (_, i) => i * yAxisStep
  );


  // Helper function to convert absolute UV values into percentages relative to today's peak
  const uvToOffset = (uv: number) => {
    if (uv >= maxUv) return "0%";
    const pct = Math.max(0, Math.min(100, (1 - uv / maxUv) * 100));
    return `${pct.toFixed(1)}%`;
  };

  return (
    <div className="w-full flex flex-col gap-4"> 
      
      <div className="h-64 w-full bg-black/[0.03] dark:bg-white/5 rounded-xl p-4 border border-black/5 dark:border-white/10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dayData} margin={{ top: 30, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="uvGradient" x1="0" y1="0" x2="0" y2="1">
                {/* Extreme Purple (11+) */}
                {maxUv >= 11 && <stop offset={uvToOffset(11)} stopColor="#AF52DE" stopOpacity={0.8} />}
                
                {/* Very High Red (8-10) */}
                {maxUv >= 8 && <stop offset={uvToOffset(8)} stopColor="#FF3B30" stopOpacity={0.8} />}
                
                {/* High Orange (6-7) */}
                {maxUv >= 6 && <stop offset={uvToOffset(6)} stopColor="#FF9500" stopOpacity={0.8} />}
                
                {/* Moderate Yellow (3-5) */}
                {maxUv >= 3 && <stop offset={uvToOffset(3)} stopColor="#FFD200" stopOpacity={0.7} />}
                
                {/* Low Green (0-2) */}
                <stop offset="100%" stopColor="#48D261" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="time"
              domain={[0, 23]}
              interval={3} 
              axisLine={false} 
              tickLine={false}
              tick={(props: any) => {
                const { x, y, payload } = props;
                const is24Hour = timeFormat === '24h';
                
                let display;
                if (is24Hour) {
                  display = [payload.value.toString().padStart(2, '0') + ':00'];
                } else {
                  const ampm = payload.value >= 12 ? 'PM' : 'AM';
                  const hour = payload.value % 12 || 12;
                  display = [`${hour}:00`, ampm];
                }

                return (
                  <g transform={`translate(${x},${y + 10})`}>
                    {display.map((text, i) => (
                      <text key={i} x={0} y={i * 12} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))">
                        {text}
                      </text>
                    ))}
                  </g>
                );
              }}
            />
            <YAxis
              domain={[0, yAxisMax]}
              ticks={yAxisTicks}
              tick={{
                fontSize: 10,
                fill: 'hsl(var(--muted-foreground))'
              }}
              axisLine={false}
              tickLine={false}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="url(#uvGradient)" 
              fill="url(#uvGradient)" 
              strokeWidth={2} 
            />
            {isCurrentDay && nowIndex !== -1 && (
              <ReferenceLine
                x={currentHour}
                xAxisId={0}
                stroke="hsl(var(--foreground))"
                strokeDasharray="3 3"
                label={{ value: 'Now', position: 'top', fontSize: 14, fill: 'hsl(var(--foreground))' }}
              />
            )}
            <Tooltip content={<CustomTooltip />} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="p-4 rounded-xl bg-black/[0.03] border border-black/5 text-sm text-foreground/80 dark:bg-white/5 dark:border-white/10 mt-4">
        <h3 className="font-semibold mb-2 text-foreground">
          About UV Index
        </h3>
        <p className="mb-4">{uvDescription}</p>

        <div className="flex w-full">
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#48D261]"></div> Low (0-2)</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#FF9500]"></div> High (6-7)</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#AF52DE]"></div> Extreme (11+)</div>
          </div>
          
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#FFD200]"></div> Moderate (3-5)</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#FF3B30]"></div> Very High (8-10)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
