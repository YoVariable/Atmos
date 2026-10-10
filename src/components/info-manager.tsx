import { Info, Sparkles, ExternalLink, Brain } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';

const MILESTONES = [
  {
    landmark: 'Sub-Zero Baseline',
    felsius: '0°Ꞓ',
    muted: '-11.4°C / 11.4°F',
    meaning: 'Severe hard freeze; pipe freeze danger and arctic winter gear.',
  },
  {
    landmark: 'Hard Freeze',
    felsius: '2°Ꞓ',
    muted: '-10.0°C / 14.0°F',
    meaning: 'Deep sub-zero cold; heavy winter protection mandatory.',
  },
  {
    landmark: 'Deep Freeze',
    felsius: '9°Ꞓ',
    muted: '-5.0°C / 23.0°F',
    meaning: 'Sustained freezing conditions; roads icy and winter coat required.',
  },
  {
    landmark: 'Freezing Baseline',
    felsius: '16°Ꞓ',
    muted: '0.0°C / 32.0°F',
    meaning: 'Frost line; water turns to ice; sub-16 requires winter protection.',
  },
  {
    landmark: 'Chilly / Jacket',
    felsius: '23°Ꞓ',
    muted: '5.0°C / 41.0°F',
    meaning: 'Brisk air; heavy jacket or coat recommended.',
  },
  {
    landmark: 'Crisp / Sweater',
    felsius: '30°Ꞓ',
    muted: '10.0°C / 50.0°F',
    meaning: 'Cool weather; light jacket or sweater required.',
  },
  {
    landmark: 'Mild Outdoor',
    felsius: '37°Ꞓ',
    muted: '15.0°C / 59.0°F',
    meaning: 'Pleasant daytime conditions; comfortable for active movement.',
  },
  {
    landmark: 'Indoor Comfort',
    felsius: '44°Ꞓ',
    muted: '20.0°C / 68.0°F',
    meaning: 'Ideal indoor climate baseline for thermostat settings.',
  },
  {
    landmark: 'Warm Summer',
    felsius: '51°Ꞓ',
    muted: '25.0°C / 77.0°F',
    meaning: 'Pleasant warm day; t-shirts, light clothing, and shorts.',
  },
  {
    landmark: 'Beach Weather',
    felsius: '58°Ꞓ',
    muted: '30.0°C / 86.0°F',
    meaning: 'Classic hot summer day; outdoor swimming and beach weather.',
  },
  {
    landmark: 'Intense Heatwave',
    felsius: '65°Ꞓ',
    muted: '35.0°C / 95.0°F',
    meaning: 'Heavy heatwave warning; active hydration and shade required.',
  },
  {
    landmark: 'Heat Dome',
    felsius: '72°Ꞓ',
    muted: '40.0°C / 104.0°F',
    meaning: 'Severe heat dome threshold; air conditioning essential.',
  },
  {
    landmark: 'Desert Extreme',
    felsius: '79°Ꞓ',
    muted: '45.0°C / 113.0°F',
    meaning: 'Extreme desert heat; hazardous long-term outdoor exposure.',
  },
  {
    landmark: 'Global Maximum',
    felsius: '86°Ꞓ',
    muted: '50.0°C / 122.0°F',
    meaning: 'Approaching recorded planetary temperature maximums.',
  },
  {
    landmark: 'Planetary Record',
    felsius: '93°Ꞓ',
    muted: '55.0°C / 131.0°F',
    meaning: 'Historical atmospheric record extremes.',
  },
  {
    landmark: 'Survival Boundary',
    felsius: '100°Ꞓ',
    muted: '60.0°C / 140.0°F',
    meaning: 'Absolute upper limit for human biological survival.',
  },
];

export function InfoManager() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-foreground/80 hover:text-foreground"
          aria-label="About Atmos"
        >
          <Info className="w-6 h-6" />
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[78dvh] sm:max-h-[85vh] bg-background/95 backdrop-blur-xl border-none shadow-2xl rounded-[2rem] p-6 flex flex-col overflow-hidden">
        <DialogTitle className="text-xl font-bold tracking-tight mb-3 shrink-0">
          About Atmos
        </DialogTitle>

        <div className="flex-1 overflow-y-auto space-y-6 text-sm text-muted-foreground pr-1.5 scrollbar-hide">
          {/* Atmos App Overview */}
          <div>
            <h4 className="font-semibold text-foreground mb-1">Version 1.4.1</h4>
            <p className="leading-relaxed">
              Atmos provides precision weather metrics for the modern enthusiast. Designed for
              speed, clarity, and a unique perspective on local conditions.
            </p>
          </div>

          {/* Environmental Thermal Milestones Guide */}
          <div className="pt-4 border-t border-black/10 dark:border-white/10 space-y-4">
            <div>
              <h4 className="font-semibold text-foreground mb-1">The Felsius Scale</h4>
              <p className="mb-3 leading-relaxed">
                Atmos features the exclusive Felsius temperature scale. Unlike standard Celsius or Fahrenheit,
                Felsius merges the two to provide a more intuitive and balanced representation of temperature,
                being the arithmetic mean of the two scales.
              </p>
            </div>

            {/* Milestones Table */}
            <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-3 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[340px]">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10 text-[11px] uppercase tracking-wider text-foreground/60 font-semibold">
                    <th className="pb-2 pl-1">Landmark</th>
                    <th className="pb-2 text-center font-mono">°Ꞓ</th>
                    <th className="pb-2 text-right pr-1">Sensory Meaning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs">
                  {MILESTONES.map((item) => (
                    <tr key={item.felsius} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 pl-1 font-medium text-foreground whitespace-nowrap">
                        <div>{item.landmark}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{item.muted}</div>
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-primary font-mono text-sm whitespace-nowrap">
                        {item.felsius}
                      </td>
                      <td className="py-2.5 pr-1 text-right text-foreground/80 leading-snug">
                        {item.meaning}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Step-Size Ratio Card */}
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-primary uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Step-Size Ratio</span>
              </div>
              <div className="font-mono text-sm font-bold text-foreground text-center py-1">
                Δ5°C = Δ7°Ꞓ = Δ9°F
              </div>
              <p className="text-xs text-foreground/80 text-center leading-relaxed">
                Every <span className="font-semibold text-foreground">5°C</span> <span className="font-semibold text-foreground">/</span> <span className="font-semibold text-foreground">9°F</span> change in temperature equals an exact <span className="font-semibold text-foreground">7°Ꞓ</span> shift.
              </p>
            </div>

            {/* Onboarding Callout Box */}
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 text-xs space-y-1.5 border border-black/5 dark:border-white/5">
              <div className="font-semibold text-foreground">Building Native Intuition</div>
              <p className="leading-relaxed text-muted-foreground">
                Use this guide to anchor major weather milestones. Once you associate{' '}
                <strong className="text-foreground font-medium">30°Ꞓ</strong> with sweaters,{' '}
                <strong className="text-foreground font-medium">44°Ꞓ</strong> with room comfort, and{' '}
                <strong className="text-foreground font-medium">58°Ꞓ</strong> with beach weather, try relying purely on °Ꞓ numbers to build direct thermal recognition!
              </p>
            </div>

            {/* Mental Estimation Shortcuts Card */}
            <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 space-y-2.5">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-sky-500 dark:text-sky-400 uppercase tracking-wider">
                <Brain className="w-3.5 h-3.5" />
                <span>Mental Estimation Rules</span>
              </div>
              
              {/* Step Lines */}
              <div className="space-y-1.5 font-mono text-xs font-bold text-foreground text-center">
                <div className="py-1 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5">
                  Δ1°Ꞓ ≈ Δ0.5°C ≈ Δ1°F
                </div>
                <div className="py-1 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5">
                  Δ2°Ꞓ ≈ Δ1.5°C ≈ Δ3°F
                </div>
                <div className="py-1 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5">
                  Δ3°Ꞓ ≈ Δ2°C ≈ Δ4°F
                </div>
              </div>

              <div className="text-xs text-foreground/80 space-y-1.5 pt-1">
                <p className="leading-relaxed">
                  <strong className="text-foreground font-medium">Quick mental rule of thumb:</strong> A <span className="font-mono text-sky-600 dark:text-sky-400 font-medium">1°Ꞓ</span> shift is roughly <span className="font-mono text-sky-600 dark:text-sky-400 font-medium">0.5°C</span> or <span className="font-mono text-sky-600 dark:text-sky-400 font-medium">1°F</span> everywhere on the scale.
                </p>
              </div>
            </div>

            {/* Original Manual Conversion Reference */}
            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl font-mono text-[12px] space-y-4 text-foreground/80 border border-black/5 dark:border-white/5">
              <div className="font-semibold text-foreground border-b border-black/10 dark:border-white/10 pb-2">
                Manual Conversion Reference:
              </div>

              <div className="space-y-1">
                <div className="text-foreground">Felsius Definition:</div>
                <div className="text-primary font-medium">{`°Ꞓ = (°C + °F) / 2`}</div>
              </div>

              <div className="space-y-1">
                <div className="text-foreground">Celsius to Felsius:</div>
                <div className="text-primary font-medium">{`°Ꞓ = 1.4(°C) + 16`}</div>
              </div>

              <div className="space-y-1">
                <div className="text-foreground">Felsius to Celsius:</div>
                <div className="text-primary font-medium">{`°C = (°Ꞓ - 16) / 1.4`}</div>
              </div>

              <div className="space-y-1">
                <div className="text-foreground">Fahrenheit to Felsius:</div>
                <div className="text-primary font-medium">{`°Ꞓ = (7(°F) - 80) / 9`}</div>
              </div>

              <div className="space-y-1">
                <div className="text-foreground">Felsius to Fahrenheit:</div>
                <div className="text-primary font-medium">{`°F = (9(°Ꞓ) + 80) / 7`}</div>
              </div>
            </div>

{/* Interactive Calculator Attribution (felsius.com) */}
<div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-2.5 text-xs">
  <div className="flex items-center justify-between">
    <h4 className="font-semibold text-foreground">Interactive Calculator Tool</h4>
    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
  </div>
  <p className="leading-relaxed text-muted-foreground">
    For instant multi-unit conversions across Felsius, Celsius, Fahrenheit, and other temperature scales without performing manual calculations, check out the official web tool created by Caleb Begly at{' '}
    <a 
      href="https://felsius.com" 
      target="_blank" 
      rel="noopener noreferrer" 
      className="text-primary underline underline-offset-4 font-medium hover:opacity-80"
    >
      felsius.com
    </a>.
  </p>
  <div className="text-[11px] text-muted-foreground pt-3 mt-1 border-t border-black/5 dark:border-white/5">
    &copy; 2020 Caleb Begly, All Rights Reserved
  </div>
</div>
          </div>

          {/* Data Attribution */}
          <div className="pt-4 border-t border-black/10 dark:border-white/10">
            <h4 className="font-semibold text-foreground mb-1">Data Attribution</h4>
            <p className="leading-relaxed">
              Weather data is powered by{' '}
              <a
                href="https://open-meteo.com/"
                className="text-primary underline underline-offset-4 font-medium"
                target="_blank"
                rel="noreferrer"
              >
                Open-Meteo
              </a>
              . Atmos maintains full compliance with all data usage and attribution standards.
            </p>
          </div>

          {/* Legal Disclaimer */}
          <div className="pt-4 border-t border-black/10 dark:border-white/10">
            <h4 className="font-semibold text-foreground mb-1">Legal Disclaimer</h4>
            <p className="leading-relaxed">
              Atmos provides information for general use only. It is not intended for safety-critical
              applications or emergency services. Use at your own discretion.
            </p>
          </div>

          {/* About the Developer */}
          <div className="pt-4 border-t border-black/10 dark:border-white/10 pb-2">
            <h4 className="font-semibold text-foreground mb-1">About the Developer</h4>
            <p className="leading-relaxed">
              You can check out the repository, source code, and find changelogs for any Atmos
              updates on this{' '}
              <a
                href="https://github.com/YoVariable"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4 font-medium"
              >
                GitHub page
              </a>
              .
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}