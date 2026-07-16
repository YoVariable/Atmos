import { useState, useEffect, useCallback, useRef } from 'react';
import type { GeocodeResult } from './weather-api';
import { reverseGeocode } from './weather-api';

export interface SavedLocation extends GeocodeResult {
  /** True for the single auto-tracked "current location" entry. */
  isCurrent?: boolean;
}

/** Reserved, stable id for the current-location entry so it is updated in
 * place (coords refreshed) instead of being duplicated every time the
 * browser's geolocation is re-read. This was the source of the "switching
 * doesn't update data" bug: every geolocation read previously created a
 * brand new entry with `Date.now()` as its id. */
const CURRENT_LOCATION_ID = -1;

function sortLocations(locations: SavedLocation[]): SavedLocation[] {
  // Current location always leads the list, matching Apple Weather's convention.
  return [...locations].sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;
    return 0;
  });
}

export function useLocations() {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [activeLocationId, setActiveLocationId] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLocatingCurrent, setIsLocatingCurrent] = useState(false);
  const hasAttemptedGeolocation = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem('weather_locations');
    const active = localStorage.getItem('weather_active_location');
    let restored: SavedLocation[] = [];
    if (saved) {
      try {
        restored = JSON.parse(saved);
      } catch (e) {}
    }
    setLocations(restored);
    if (active) {
      setActiveLocationId(Number(active));
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('weather_locations', JSON.stringify(locations));
      if (activeLocationId !== null) {
        localStorage.setItem('weather_active_location', activeLocationId.toString());
      } else {
        localStorage.removeItem('weather_active_location');
      }
    }
  }, [locations, activeLocationId, isLoaded]);

  const upsertCurrentLocation = useCallback(
    (loc: Omit<SavedLocation, 'id' | 'isCurrent'>) => {
      setLocations((prev) => {
        const existing = prev.find((p) => p.id === CURRENT_LOCATION_ID);
        const updated: SavedLocation = { ...loc, id: CURRENT_LOCATION_ID, isCurrent: true };
        if (existing) {
          return prev.map((p) => (p.id === CURRENT_LOCATION_ID ? updated : p));
        }
        return [updated, ...prev];
      });
    },
    [],
  );

  /** Refresh the browser's geolocation and upsert the current-location entry. */
  const refreshCurrentLocation = useCallback(
    (opts: { makeActive?: boolean } = {}) => {
      if (!navigator.geolocation) return;
      setIsLocatingCurrent(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const name = await reverseGeocode(latitude, longitude);
            upsertCurrentLocation({
              name: name || 'Current Location',
              country: '',
              latitude,
              longitude,
              timezone: 'auto',
            });
            if (opts.makeActive) {
              setActiveLocationId(CURRENT_LOCATION_ID);
            }
          } catch (e) {
            console.error(e);
          } finally {
            setIsLocatingCurrent(false);
          }
        },
        () => setIsLocatingCurrent(false),
      );
    },
    [upsertCurrentLocation],
  );

  // On first load, silently try to establish the current location so it is
  // the first thing shown when the app opens. If permission was already
  // granted this resolves instantly with no prompt; if denied, we just fall
  // back to whatever locations are already saved.
  useEffect(() => {
    if (!isLoaded || hasAttemptedGeolocation.current) return;
    hasAttemptedGeolocation.current = true;
    const hasCurrent = locations.some((l) => l.id === CURRENT_LOCATION_ID);
    if (!hasCurrent) {
      refreshCurrentLocation({ makeActive: activeLocationId === null });
    }
  }, [isLoaded, locations, activeLocationId, refreshCurrentLocation]);

  const addLocation = useCallback((loc: SavedLocation) => {
    setLocations((prev) => {
      if (prev.find((p) => p.id === loc.id)) return prev;
      return [...prev, loc];
    });
    setActiveLocationId(loc.id);
  }, []);

  const removeLocation = useCallback(
    (id: number) => {
      setLocations((prev) => {
        const next = prev.filter((p) => p.id !== id);
        if (activeLocationId === id) {
          setActiveLocationId(next.length > 0 ? sortLocations(next)[0].id : null);
        }
        return next;
      });
    },
    [activeLocationId],
  );

  const orderedLocations = sortLocations(locations);
  const activeLocation = orderedLocations.find((l) => l.id === activeLocationId) || null;

  return {
    locations: orderedLocations,
    activeLocation,
    activeLocationId,
    setActiveLocationId,
    addLocation,
    removeLocation,
    refreshCurrentLocation,
    isLocatingCurrent,
    isLoaded,
  };
}
