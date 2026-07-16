import type { CurrentWeather } from '@/lib/weather-api';
import { formatFelsiusValue, FELSIUS_UNIT } from '@/lib/units';

export function FeelsLikeDetailContent({ current }: { current: CurrentWeather }) {
  const actual = formatFelsiusValue(current.temperature_2m);
  const feelsLike = formatFelsiusValue(current.apparent_temperature);
  const delta = feelsLike - actual;

  let explanation: string;
  if (Math.abs(delta) < 1) {
    explanation = 'Feels about the same as the actual temperature.';
  } else if (delta > 0) {
    explanation =
      current.relative_humidity_2m >= 50
        ? `Feels ${delta}${FELSIUS_UNIT} warmer than the actual temperature, mainly due to humidity.`
        : `Feels ${delta}${FELSIUS_UNIT} warmer than the actual temperature.`;
  } else {
    explanation =
      current.wind_speed_10m >= 15
        ? `Feels ${Math.abs(delta)}${FELSIUS_UNIT} cooler than the actual temperature, mainly due to wind.`
        : `Feels ${Math.abs(delta)}${FELSIUS_UNIT} cooler than the actual temperature.`;
  }

  return (
    <div className="space-y-6">
      <div className="text-6xl font-medium tracking-tight">
        {feelsLike}
        {FELSIUS_UNIT}
      </div>
      <p className="text-sm text-foreground/70 leading-relaxed">{explanation}</p>

      <div className="glass-panel p-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground/60">Actual Temperature</span>
        <span className="text-lg font-medium font-mono">
          {actual}
          {FELSIUS_UNIT}
        </span>
      </div>
    </div>
  );
}
