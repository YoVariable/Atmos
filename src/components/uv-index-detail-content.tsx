import { Area, AreaChart, ResponsiveContainer, YAxis, Tooltip, CartesianGrid, XAxis, ReferenceLine } from 'recharts';
import { formatHourLabel, formatTime } from '../lib/units';
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

export function UVIndexDetailContent({ hourly, initialDayIndex, timezone }: UVIndexDetailContentProps) {
  const { settings } = useSettings();
  const { timeFormat } = settings;

  const getUvWindow = (hourlyData: { uv_index: number[], time: string[] }, startIdx: number) => {
    const dayUvIndices = hourlyData.uv_index.slice(startIdx, startIdx + 24);
    const dayTimes = hourlyData.time.slice(startIdx, startIdx + 24);
    const moderateOrHigherIndices = dayUvIndices
      .map((val: number, idx: number) => (val >= 3 ? idx : -1))
      .filter((idx: number) => idx !== -1);

    if (moderateOrHigherIndices.length <= 1) return null;
    const startHourStr = dayTimes[moderateOrHigherIndices[0]].split('T')[1].split(':')[0];
    const endHourStr = dayTimes[moderateOrHigherIndices[moderateOrHigherIndices.length - 1]].split('T')[1].split(':')[0];
    return { startHour: parseInt(startHourStr), endHour: parseInt(endHourStr) };
  };

  const startIndex = (initialDayIndex || 0) * 24;

  const dayData = Array.from({ length: 24 }).map((_, i) => {
    const idx = startIndex + i;
    const timeStr = hourly?.time?.[idx];
    
    let hour = i; 
    if (timeStr) {
      const parts = timeStr.split('T')[1].split(':');
      hour = parseInt(parts[0]);
    }
    
    const value = typeof hourly?.uv_index?.[idx] === 'number' ? hourly.uv_index[idx] : 0;
    return { time: hour, value };
  });

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    hour: 'numeric',
    hourCycle: 'h23',
  });
  const currentHour = parseInt(formatter.format(new Date()), 10);
  const nowIndex = dayData.findIndex((item) => item.time === currentHour);

  const currentUvValue = nowIndex !== -1 ? dayData[nowIndex].value : 0;
  const advice = getUvAdvice(currentUvValue);
  const uvWindow = hourly ? getUvWindow(hourly, startIndex) : null;

  let windowText = "";

  if (uvWindow) {
    const viewDate = new Date();
    viewDate.setDate(viewDate.getDate() + (initialDayIndex || 0));

    const startDate = new Date(viewDate);
    startDate.setHours(uvWindow.startHour, 0, 0, 0);
    const endDate = new Date(viewDate);
    endDate.setHours(uvWindow.endHour, 0, 0, 0);

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: timeFormat === '12h',
    };

    const startLabel = new Intl.DateTimeFormat('en-US', timeOptions).format(startDate);
    const endLabel = new Intl.DateTimeFormat('en-US', timeOptions).format(endDate);

    if (uvWindow.startHour === uvWindow.endHour) {
      windowText = "Moderate (3) levels expected briefly around " + startLabel + ".";
    } else if (currentHour < uvWindow.startHour) {
      windowText = `Levels of Moderate (3) or higher are reached from ${startLabel} to ${endLabel}.`;
    } else if (currentHour >= uvWindow.startHour && currentHour <= uvWindow.endHour) {
      windowText = `Moderate (3) or higher levels currently. They last until ${endLabel}.`;
    } else {
      windowText = `Low for the rest of the day. Levels of Moderate (3) or higher were reached from ${startLabel} to ${endLabel}.`;
    }

  } else {
    windowText = "Low levels throughout the day.";
  }

  // Calculate maximum UV value for the day to dynamically scale gradient stops
  const maxUv = Math.max(...dayData.map(d => d.value), 1);

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
            <YAxis domain={[0, 12]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickCount={4} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="url(#uvGradient)" 
              fill="url(#uvGradient)" 
              strokeWidth={2} 
            />
            <ReferenceLine 
              x={nowIndex} 
              xAxisId={0} 
              stroke="hsl(var(--foreground))" 
              strokeDasharray="3 3" 
              label={{ value: 'Now', position: 'top', fontSize: 14, fill: 'hsl(var(--foreground))' }} 
            />
            <Tooltip content={<CustomTooltip />} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="p-4 rounded-xl bg-black/[0.03] border border-black/5 text-sm text-foreground/80 dark:bg-white/5 dark:border-white/10 mt-4">
        <h3 className="font-semibold mb-2 text-foreground">About UV Index</h3>
        <p className="mb-4">
          {currentUvValue >= 3 ? "Sun protection recommended." : "No sun protection needed."}{" "}
          {windowText}
        </p>

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

function getUvAdvice(currentUvValue: number) {
  if (currentUvValue <= 2) return 'not required';
  if (currentUvValue <= 5) return 'recommended';
  if (currentUvValue <= 7) return 'required — protection advised (sunscreen, hat, shade)';
  if (currentUvValue <= 10) return 'required — extra protection (sunscreen, hat, sunglasses, seek shade)';
  return 'required — extreme risk (avoid sun, cover up)';
}