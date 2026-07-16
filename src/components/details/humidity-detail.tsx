import type { CurrentWeather } from '@/lib/weather-api';
import { formatFelsius, formatHumidity } from '@/lib/units';
import { getDewPointComfort } from '@/lib/weather-helpers';

export function HumidityDetailContent({ current }: { current: CurrentWeather }) {
  const comfort = getDewPointComfort(current.dew_point_2m);

  return (
    <div className="space-y-6">
      <div className="text-6xl font-medium tracking-tight font-mono">
        {formatHumidity(current.relative_humidity_2m)}
      </div>
      <p className="text-sm text-foreground/70 leading-relaxed">
        The dew point is {formatFelsius(current.dew_point_2m)} right now — {comfort.toLowerCase()}.
      </p>

      <div className="glass-panel p-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground/60">Dew Point</span>
        <span className="text-lg font-medium font-mono">{formatFelsius(current.dew_point_2m)}</span>
      </div>
    </div>
  );
}
