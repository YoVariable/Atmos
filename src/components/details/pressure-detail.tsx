import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { CurrentWeather, HourlyForecast } from '@/lib/weather-api';
import { formatPressure } from '@/lib/units';
import { getPressureTrend, getPressureTrendDescription } from '@/lib/weather-helpers';
import { useSettings } from '@/lib/use-settings';

export function PressureDetailContent({
  current,
  hourly,
}: {
  current: CurrentWeather;
  hourly: HourlyForecast;
}) {
  const { settings } = useSettings();

  const nowMs = new Date(current.time).getTime();
  let nowIdx = 0;
  let bestDiff = Infinity;
  hourly.time.forEach((t, i) => {
    const diff = Math.abs(new Date(t).getTime() - nowMs);
    if (diff < bestDiff) { bestDiff = diff; nowIdx = i; }
  });
  const pastIdx = Math.max(0, nowIdx - 3);
  const pastPressure = hourly.pressure_msl[pastIdx];
  const trend = getPressureTrend(current.pressure_msl - pastPressure);
  const TrendIcon = trend === 'rising' ? ArrowUp : trend === 'falling' ? ArrowDown : Minus;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="text-6xl font-medium tracking-tight font-mono">
          {formatPressure(current.pressure_msl, settings.pressureUnit)}
        </div>
        <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center">
          <TrendIcon className="w-5 h-5 text-primary" />
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-lg font-semibold capitalize">{trend}</div>
        <p className="text-sm text-foreground/70 leading-relaxed">
          {getPressureTrendDescription(trend)}
        </p>
      </div>
    </div>
  );
}
