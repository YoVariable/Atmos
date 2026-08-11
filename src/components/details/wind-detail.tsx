import type { CurrentWeather } from '@/lib/weather-api';
import { formatWindSpeed } from '@/lib/units';
import { getWindDirectionLabel, getWindDescription } from '@/lib/weather-helpers';
import { useSettings } from '@/lib/use-settings';

export function WindDetailContent({ current }: { current: CurrentWeather }) {
  const { settings } = useSettings();
  const directionLabel = getWindDirectionLabel(current.wind_direction_10m);
  const description = getWindDescription(current.wind_speed_10m);
  
  // Meteorological wind direction = degrees the wind comes FROM.
  // Add 180° so the arrow points back toward the source.
  const arrowRotation = current.wind_direction_10m + 180;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-4xl font-medium tracking-tight font-mono">
            {formatWindSpeed(current.wind_speed_10m, settings.windUnit)}
          </div>
          <div className="text-sm font-semibold text-foreground/70">{description}</div>
        </div>
        <div className="w-20 h-20 rounded-full border border-black/10 flex items-center justify-center bg-black/5 shadow-inner relative">
          {(['N', 'E', 'S', 'W'] as const).map((label, i) => (
            <span
              key={label}
              className="absolute text-[10px] font-bold text-foreground/40"
              style={{
                top: i === 0 ? 2 : i === 2 ? undefined : '50%',
                bottom: i === 2 ? 2 : undefined,
                left: i === 3 ? 4 : i === 1 ? undefined : '50%',
                right: i === 1 ? 4 : undefined,
                transform: i === 0 || i === 2 ? 'translateX(-50%)' : 'translateY(-50%)',
              }}
            >
              {label}
            </span>
          ))}
          <svg
            className="w-7 h-7 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: `rotate(${arrowRotation}deg)`,
            }}
          >
            <polygon points="12 2 19 21 12 17 5 21 12 2" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass-panel p-3">
          <div className="text-xs font-semibold uppercase tracking-widest text-foreground/50 mb-1">
            Direction
          </div>
          <div className="text-lg font-medium font-mono">
            {directionLabel}{' '}
            <span className="text-sm font-sans font-semibold text-foreground/50">
              {Math.round(current.wind_direction_10m)}°
            </span>
          </div>
        </div>
        <div className="glass-panel p-3">
          <div className="text-xs font-semibold uppercase tracking-widest text-foreground/50 mb-1">
            Gusts
          </div>
          <div className="text-lg font-medium font-mono">
            {formatWindSpeed(current.wind_gusts_10m, settings.windUnit)}
          </div>
        </div>
      </div>
    </div>
  );
}