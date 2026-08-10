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

  // Format the label based on user settings
  const hourForLabel = typeof label === 'number'
    ? label
    : (typeof label === 'string' && /^\d+$/.test(label) ? parseInt(label, 10) : 0);

  const displayLabel = timeFormat === '12h'
    ? new Date(2026, 0, 1, hourForLabel).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    : `${hourForLabel.toString().padStart(2, '0')}:00`;

  return (
    // Updated to use semantic theme variables for background and border
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

  return (
    <div className="w-full flex flex-col gap-4"> 
      
      {/* Applied dark mode backgrounds and borders to mirror the info box */}
      <div className="h-64 w-full bg-black/[0.03] dark:bg-white/5 rounded-xl p-4 border border-black/5 dark:border-white/10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dayData} margin={{ top: 30, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="uvGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d946ef" />
                <stop offset="25%" stopColor="#f43f5e" />
                <stop offset="50%" stopColor="#f97316" />
                <stop offset="75%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            {/* Switched to CSS variable for stroke to support dark/light themes */}
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
                      // Switched fill to standard muted-foreground variable
                      <text key={i} x={0} y={i * 12} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))">
                        {text}
                      </text>
                    ))}
                  </g>
                );
              }}
            />
            {/* Switched tick fill to standard muted-foreground variable */}
            <YAxis domain={[0, 12]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickCount={4} />
            <Area type="monotone" dataKey="value" stroke="#f97316" fill="url(#uvGradient)" strokeWidth={2} />
            <ReferenceLine 
              x={nowIndex} 
              xAxisId={0} 
              stroke="hsl(var(--foreground))" // Replaced hardcoded black
              strokeDasharray="3 3" 
              label={{ value: 'Now', position: 'top', fontSize: 14, fill: 'hsl(var(--foreground))' }} // Replaced hardcoded black
            />
            <Tooltip content={<CustomTooltip />} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Info Box (Dark mode was already correctly implemented here) */}
      <div className="p-4 rounded-xl bg-black/[0.03] border border-black/5 text-sm text-foreground/80 dark:bg-white/5 dark:border-white/10 mt-4">
        <h3 className="font-semibold mb-2 text-foreground">About UV Index</h3>
        <p className="mb-4">
          {currentUvValue >= 3 ? "Sun protection recommended." : "No sun protection needed."}{" "}
          {windowText}
        </p>

        <div className="flex w-full">
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> Low (0-2)</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div> High (6-7)</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div> Extreme (11+)</div>
          </div>
          
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Moderate (3-5)</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Very High (8-10)</div>
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