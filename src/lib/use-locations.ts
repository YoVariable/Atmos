import { createContext, useContext, ReactNode, createElement } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { GeocodeResult } from './weather-api';
import { reverseGeocode } from './weather-api';
import { Geolocation } from '@capacitor/geolocation';

export interface SavedLocation extends GeocodeResult {
  /** True for the single auto-tracked "current location" entry. */
  isCurrent?: boolean;
}

/** Reserved, stable id for the current-location entry so it is updated in
 * place (coords refreshed) instead of being duplicated every time. */
const CURRENT_LOCATION_ID = -1;

/** 
 * Calculate distance between two coordinate points using the 
 * exact IUGG arithmetic mean radius of Earth (6371.0088 km).
 */
function hasMovedSignificantly(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number, 
  thresholdKm = 1.5
): boolean {
  const EARTH_RADIUS_KM = 6371.0088; 
  const toRad = (value: number) => (value * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (EARTH_RADIUS_KM * c) >= thresholdKm;
}

// 1. Create the Context
const LocationsContext = createContext<ReturnType<typeof useLocationsValue> | null>(null);

// 2. Create the Provider that wraps the app
export function LocationsProvider({ children }: { children: ReactNode }) {
  const value = useLocationsValue();
  return createElement(LocationsContext.Provider, { value }, children);
}

function sortLocations(locations: SavedLocation[]): SavedLocation[] {
  return [...locations].sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;
    return 0;
  });
}

// 3. Create the Hook that components will use to access the context
export function useLocations() {
  const context = useContext(LocationsContext);
  if (!context) throw new Error("useLocations must be used within a LocationsProvider");
  return context;
}

export function useLocationsValue() {
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

  const refreshCurrentLocation = useCallback(
    async (opts: { makeActive?: boolean } = {}) => {
      setIsLocatingCurrent(true);

      try {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0 
        });

        const { latitude, longitude } = position.coords;
        let locationName = `API Blocked: ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`; 

        try {
          const fetchedName = await reverseGeocode(latitude, longitude);
          if (fetchedName) {
            locationName = fetchedName;
          }
        } catch (geocodeError) {
          console.warn("Reverse geocoding failed", geocodeError);
        }

        upsertCurrentLocation({
          name: locationName,
          country: '',
          latitude,
          longitude,
          timezone: 'auto',
        });

        if (opts.makeActive) {
          setActiveLocationId(CURRENT_LOCATION_ID);
        }
      } catch (error: any) {
        console.error("Critical error setting current location:", error.message);
      } finally {
        setIsLocatingCurrent(false);
      }
    },
    [upsertCurrentLocation, setActiveLocationId]
  );

  // On first load, check if we need to set or auto-update current location based on distance shift (> 1.5 km)
  useEffect(() => {
    if (!isLoaded || hasAttemptedGeolocation.current) return;
    hasAttemptedGeolocation.current = true;

    const existingCurrent = locations.find((l) => l.id === CURRENT_LOCATION_ID);

    if (!existingCurrent) {
      refreshCurrentLocation({ makeActive: activeLocationId === null });
    } else {
      Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }).then(async (position) => {
        const { latitude, longitude } = position.coords;
        if (hasMovedSignificantly(existingCurrent.latitude, existingCurrent.longitude, latitude, longitude, 1.5)) {
          await refreshCurrentLocation();
        }
      }).catch((err) => {
        console.warn("Background distance check skipped:", err);
      });
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

  const updateLocations = useCallback(
    (newLocations: SavedLocation[]) => {
      setLocations(newLocations);
    },
    []
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
    updateLocations,
  };
}