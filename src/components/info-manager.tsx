import { Info } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';

export function InfoManager() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors text-foreground/80 hover:text-foreground"
          aria-label="About Atmos"
        >
          <Info className="w-6 h-6" />
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-none shadow-2xl rounded-[2rem] p-6 flex flex-col [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogTitle className="text-xl font-medium tracking-tight mb-4">About Atmos</DialogTitle>
        
        <div className="space-y-6 text-sm text-muted-foreground">
          {/* Atmos Info */}
          <div>
            <h4 className="font-semibold text-foreground mb-1">Version 1.0.0</h4>
            <p>Atmos provides precision weather metrics for the modern enthusiast. Designed for speed, clarity, and a unique perspective on local conditions.</p>
          </div>

          {/* Felsius Subsection */}
          <div className="pt-4 border-t border-black/5">
            <h4 className="font-semibold text-foreground mb-1">The Felsius Scale</h4>
            <p className="mb-3">
              Atmos features the exclusive Felsius temperature scale. Unlike standard Celsius or Fahrenheit,
              Felsius merges the two to provide a more intuitive and balanced representation of temperature,
              being the arithmetic mean of the two scales.
            </p>

            <div className="bg-black/5 p-4 rounded-xl font-mono text-[12px] space-y-4 text-foreground/80">
              <div className="font-semibold text-foreground border-b border-black/10 pb-2">
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
                <div className="text-foreground">Felsius to Fahrenheit:</div>
                <div className="text-primary font-medium">{`°F = (1.8(°Ꞓ) + 16) / 1.4`}</div>
              </div>

              <div className="space-y-1">
                <div className="text-foreground">Fahrenheit to Felsius:</div>
                <div className="text-primary font-medium">{`°Ꞓ = (1.4(°F) - 16) / 1.8`}</div>
              </div>
            </div>
          </div>

          {/* Attribution */}
          <div className="pt-4 border-t border-black/5">
            <h4 className="font-semibold text-foreground mb-1">Data Attribution</h4>
            <p>
              Weather data is powered by <a href="https://open-meteo.com/" className="underline hover:text-primary transition-colors" target="_blank" rel="noreferrer">Open-Meteo</a>. 
              Atmos maintains full compliance with all data usage and attribution standards.
            </p>
          </div>

          {/* Legal */}
          <div className="pt-4 border-t border-black/5">
            <h4 className="font-semibold text-foreground mb-1">Legal Disclaimer</h4>
            <p>
              Atmos provides information for general use only. It is not intended for safety-critical 
              applications or emergency services. Use at your own discretion.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}