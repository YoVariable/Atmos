import type { AirQuality } from '@/lib/weather-api';
import { getAqiBand, getAqiPosition } from '@/lib/aqi';

const POLLUTANTS: { key: keyof AirQuality; label: string }[] = [
  { key: 'pm2_5', label: 'PM2.5' },
  { key: 'pm10', label: 'PM10' },
  { key: 'ozone', label: 'Ozone' },
  { key: 'nitrogen_dioxide', label: 'NO2' },
  { key: 'sulphur_dioxide', label: 'SO2' },
  { key: 'carbon_monoxide', label: 'CO' },
];

export function AirQualityDetailContent({ 
  airQuality, 
  unit = 'μg/m³' 
}: { 
  airQuality: AirQuality;
  unit?: string;
}) {
  const band = getAqiBand(airQuality.us_aqi);
  const position = getAqiPosition(airQuality.us_aqi);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="text-6xl font-medium tracking-tight">{Math.round(airQuality.us_aqi)}</div>
        <div className="text-lg font-semibold">{band.label}</div>
        <p className="text-sm text-foreground/70 leading-relaxed">{band.description}</p>
        <div className="relative h-2 rounded-full bg-black/5 overflow-hidden mt-2">
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to right, rgb(34 197 94), rgb(234 179 8), rgb(249 115 22), rgb(239 68 68), rgb(168 85 247), rgb(136 19 55))',
            }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-sm ring-1 ring-black/20"
            style={{ left: `${Math.max(0, Math.min(97, position * 100))}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {POLLUTANTS.map(({ key, label }) => {
          const value = airQuality[key];
          return (
            <div key={key} className="glass-panel p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-foreground/50 mb-1">
                {label}
              </div>
              <div className="text-lg font-medium font-mono">
                {typeof value === 'number' 
                  ? unit === 'gr/ft³' 
                  ? (() => {
                      const scientific = (value * 0.000000436996).toExponential(2).split('e');
                      const mantissa = scientific[0];
                      const exponent = parseInt(scientific[1]);
                      return (
                        <>
                          {mantissa} &times; 10<sup className="text-[0.6em]">{exponent}</sup>
                        </>
                      );
                    })()
                  : Math.round(value)
                  : '--'}
                <span className="text-xs font-sans font-semibold text-foreground/50 ml-1">
                  {unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}