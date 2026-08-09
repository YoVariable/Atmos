import type { AirQuality, CurrentWeather } from '@/lib/weather-api';
import { getAqiBand, getAqiPosition } from '@/lib/aqi';
import { convertUgM3ToPpblv, GAS_MOLECULAR_WEIGHTS } from '@/lib/units';

const POLLUTANTS: { key: keyof AirQuality; label: string; gasKey?: keyof typeof GAS_MOLECULAR_WEIGHTS }[] = [
  { key: 'pm2_5', label: 'PM2.5' },
  { key: 'pm10', label: 'PM10' },
  { key: 'ozone', label: 'Ozone', gasKey: 'OZONE' },
  { key: 'nitrogen_dioxide', label: 'NO2', gasKey: 'NO2' },
  { key: 'sulphur_dioxide', label: 'SO2', gasKey: 'SO2' },
  { key: 'carbon_monoxide', label: 'CO', gasKey: 'CO' },
];

export function AirQualityDetailContent({ 
  airQuality, 
  current,
  gasUnit = 'μg/m³',
  pmUnit = 'μg/m³'
}: { 
  airQuality: AirQuality;
  current: CurrentWeather;
  gasUnit?: string;
  pmUnit?: string;
}) {
  const band = getAqiBand(airQuality.us_aqi);
  const position = getAqiPosition(airQuality.us_aqi);
  const pressurePa = current.surface_pressure * 100;

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
        {POLLUTANTS.map(({ key, label, gasKey }) => {
          const rawValue = airQuality[key];
          const isGas = Boolean(gasKey);
          const activeUnit = isGas ? gasUnit : pmUnit;

          if (typeof rawValue !== 'number') {
            return (
              <div key={key} className="glass-panel p-3">
                <div className="text-xs font-semibold uppercase tracking-widest text-foreground/50 mb-1">
                  {label}
                </div>
                <div className="text-lg font-medium font-mono">
                  --<span className="text-xs font-sans font-semibold text-foreground/50 ml-1">{activeUnit}</span>
                </div>
              </div>
            );
          }

          let displayValue = rawValue;

          // Convert gases to ppbv if requested
          if (isGas && activeUnit === 'ppbv' && gasKey && GAS_MOLECULAR_WEIGHTS[gasKey]) {
            displayValue = convertUgM3ToPpblv(
              rawValue, 
              GAS_MOLECULAR_WEIGHTS[gasKey], 
              current.temperature_2m, 
              pressurePa
            );
          }

          return (
            <div key={key} className="glass-panel p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-foreground/50 mb-1">
                {label}
              </div>
              <div className="text-lg font-medium font-mono">
                {activeUnit === 'gr/ft³' ? (() => {
                  // Conversion factor from ug/m3 to grains/ft³
                  const grainsValue = rawValue * 0.000000436996;
                  const scientific = grainsValue.toExponential(2).split('e');
                  const mantissa = scientific[0];
                  const exponent = parseInt(scientific[1]);
                  return (
                    <>
                      {mantissa} &times; 10<sup className="text-[0.6em]">{exponent}</sup>
                    </>
                  );
                })() : (
                  Math.round(displayValue)
                )}
                <span className="text-xs font-sans font-semibold text-foreground/50 ml-1">
                  {activeUnit}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}