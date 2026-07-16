import { useState } from 'react';
import type { ReactNode } from 'react';
import { useSettings } from '@/lib/use-settings';
import { LONG_DATE_FORMAT_OPTIONS } from '@/lib/date-utils';
import {
  WIND_UNIT_OPTIONS,
  DISTANCE_UNIT_OPTIONS,
  PRESSURE_UNIT_OPTIONS,
  PRECIPITATION_UNIT_OPTIONS,
  TIME_FORMAT_OPTIONS,
  FELSIUS_UNIT,
} from '@/lib/units';
import type {
  WindUnit, DistanceUnit, PressureUnit, PrecipitationUnit, TimeFormat,
} from '@/lib/units';
import type { LongDateFormat } from '@/lib/date-utils';
import { Settings, Check, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';

// ─── Generic pill select (type inferred from options) ────────────────────────

function PillSelect({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
            value === opt.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-black/5 text-foreground/70 hover:bg-black/10'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-widest text-foreground/50">{title}</div>
      {children}
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-sm font-medium text-foreground/70">{label}</div>
      {children}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function SettingsManager() {
  const { settings, updateSettings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);

  // Force 'Day, Month, Year' to the top of the list
  const baseOptions = [...LONG_DATE_FORMAT_OPTIONS];
  const orderedDateOptions = baseOptions.sort((a, b) => {
    if (a.label === 'Day, Month, Year') return -1;
    if (b.label === 'Day, Month, Year') return 1;
    return 0;
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors text-foreground/80 hover:text-foreground"
          aria-label="Settings"
        >
          <Settings className="w-6 h-6" />
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-none shadow-2xl rounded-[2rem] p-6 max-h-[85vh] overflow-hidden flex flex-col">
        <DialogTitle className="text-xl font-medium tracking-tight mb-1">Settings</DialogTitle>

        <div className="flex-1 overflow-y-auto space-y-6 pb-4 scrollbar-hide">

          {/* ── Time Format ── */}
          <Section title="Time Format">
            <PillSelect
              options={TIME_FORMAT_OPTIONS}
              value={settings.timeFormat}
              onChange={(v) => updateSettings({ timeFormat: v as TimeFormat })}
            />
          </Section>

          {/* ── Date Format ── */}
          <Section title="7-Day Forecast Date Format">
            <div className="space-y-2">
              {orderedDateOptions.map((option) => {
              // Simply check if a setting exists, otherwise default to the first option
                const currentSetting = settings.longDateFormat || orderedDateOptions[0].value;
                const isSelected = currentSetting === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => updateSettings({ longDateFormat: option.value as LongDateFormat })}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all text-left ${
                      isSelected ? 'bg-white shadow-sm ring-1 ring-black/5' : 'bg-white/40 hover:bg-white/80'
                    }`}
                  >
                    <div className="min-w-0 pr-4">
                      <div className="font-semibold text-[15px] tracking-tight">{option.label}</div>
                      <div className="text-xs font-medium text-muted-foreground mt-0.5">{option.example}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ── Units ── */}
          <Section title="Units">

            <SettingRow label="Wind Speed">
              <PillSelect
                options={WIND_UNIT_OPTIONS}
                value={settings.windUnit}
                onChange={(v) => updateSettings({ windUnit: v as WindUnit })}
              />
            </SettingRow>

            <SettingRow label="Distance">
              <PillSelect
                options={DISTANCE_UNIT_OPTIONS}
                value={settings.distanceUnit}
                onChange={(v) => updateSettings({ distanceUnit: v as DistanceUnit })}
              />
            </SettingRow>

            <SettingRow label="Pressure">
              <PillSelect
                options={PRESSURE_UNIT_OPTIONS}
                value={settings.pressureUnit}
                onChange={(v) => updateSettings({ pressureUnit: v as PressureUnit })}
              />
            </SettingRow>

            <SettingRow label="Precipitation">
              <PillSelect
                options={PRECIPITATION_UNIT_OPTIONS}
                value={settings.precipitationUnit}
                onChange={(v) => updateSettings({ precipitationUnit: v as PrecipitationUnit })}
              />
            </SettingRow>
            
            {/* New Air Pollution Picker */}
            <SettingRow label="Air Pollution">
              <PillSelect
                options={[
                  { value: 'μg/m³', label: 'μg/m³' },
                  { value: 'gr/ft³', label: 'gr/ft³' }
                ]}
                value={(settings as any).airPollutionUnit || 'μg/m³'}
                onChange={(v) => updateSettings({ airPollutionUnit: v } as any)}
              />
            </SettingRow>

            {/* Temperature — locked */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-black/[0.03] border border-black/5">
              <Lock className="w-4 h-4 text-foreground/30 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground/50">Temperature</div>
                <div className="text-xs text-foreground/40 mt-0.5">
                  Locked to Felsius ({FELSIUS_UNIT}) — a scale exclusive to Atmos.
                </div>
              </div>
            </div>

          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}