import type { CurrentWeather } from '@/lib/weather-api';
import { formatVisibility } from '@/lib/units';
import { getVisibilityBand } from '@/lib/weather-helpers';
import { useSettings } from '@/lib/use-settings';

export function VisibilityDetailContent({ current }: { current: CurrentWeather }) {
  const { settings } = useSettings();
  const band = getVisibilityBand(current.visibility);

  return (
    <div className="space-y-6">
      <div className="text-6xl font-medium tracking-tight font-mono">
        {formatVisibility(current.visibility, settings.distanceUnit)}
      </div>
      <div className="space-y-1">
        <div className="text-lg font-semibold">{band.label}</div>
        <p className="text-sm text-foreground/70 leading-relaxed">{band.description}</p>
      </div>
    </div>
  );
}
