import { Info, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';

const MILESTONES = [
  {
    landmark: 'Deep Freeze',
    felsius: '0°Ꞓ',
    muted: '-11.4°C / 11.4°F',
    meaning: 'Severe hard freeze; pipe freeze danger and arctic winter gear.',
  },
  {
    landmark: 'Freezing Baseline',
    felsius: '16°Ꞓ',
    muted: '0°C / 32°F',
    meaning: 'Frost line; water turns to ice; sub-16 requires winter protection.',
  },
  {
    landmark: 'Crisp / Jacket',
    felsius: '30°Ꞓ',
    muted: '10°C / 50°F',
    meaning: 'Cool weather; light jacket or sweater required.',
  },
  {
    landmark: 'Indoor Comfort',
    felsius: '45°Ꞓ',
    muted: '20.7°C / 69.3°F',
    meaning: 'Ideal indoor climate baseline for thermostat settings.',
  },
  {
    landmark: 'Summer Heat',
    felsius: '60°Ꞓ',
    muted: '31.4°C / 88.6°F',
    meaning: 'Classic warm summer day; beach weather, shorts, and t-shirts.',
  },
  {
    landmark: 'Heatwave Warning',
    felsius: '70°Ꞓ',
    muted: '38.6°C / 101.4°F',
    meaning: 'Severe heat dome threshold; active hydration and AC required.',
  },
  {
    landmark: 'Survival Boundary',
    felsius: '100°Ꞓ',
    muted: '60°C / 140°F',
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

      <DialogContent className="sm:max-w-lg max-h-[85vh] bg-background/95 backdrop-blur-xl border-none shadow-2xl rounded-[2rem] p-6 flex flex-col overflow-hidden">
        <DialogTitle className="text-xl font-bold tracking-tight mb-3 shrink-0">
          About Atmos
        </DialogTitle>

        <div className="flex-1 overflow-y-auto space-y-6 text-sm text-muted-foreground pr-1.5 scrollbar-hide">
          {/* Atmos App Overview */}
          <div>
            <h4 className="font-semibold text-foreground mb-1">Version 1.4.0</h4>
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
                <strong className="text-foreground font-medium">45°Ꞓ</strong> with room comfort, and{' '}
                <strong className="text-foreground font-medium">60°Ꞓ</strong> with summer heat, try relying purely on °Ꞓ numbers to build direct thermal recognition!
              </p>
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