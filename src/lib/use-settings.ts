import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  createElement,
  type ReactNode,
} from 'react';
import type { LongDateFormat } from './date-utils';
import type {
  WindUnit,
  DistanceUnit,
  PressureUnit,
  PrecipitationUnit,
  TimeFormat,
} from './units';

const STORAGE_KEY = 'weather_settings_v2';

export interface WeatherSettings {
  longDateFormat: LongDateFormat;
  timeFormat: TimeFormat;
  windUnit: WindUnit;
  distanceUnit: DistanceUnit;
  pressureUnit: PressureUnit;
  precipitationUnit: PrecipitationUnit;
}

const DEFAULT_SETTINGS: WeatherSettings = {
  longDateFormat: 'dmy',
  timeFormat: '24h',
  windUnit: 'kmh',
  distanceUnit: 'km',
  pressureUnit: 'hPa',
  precipitationUnit: 'mm_cm',
};

interface SettingsContextValue {
  settings: WeatherSettings;
  updateSettings: (patch: Partial<WeatherSettings>) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
});

function readSettings(): WeatherSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<WeatherSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(readSettings());
  }, []);

  const updateSettings = useCallback((patch: Partial<WeatherSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return createElement(SettingsContext.Provider, { value: { settings, updateSettings } }, children);
}

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}
