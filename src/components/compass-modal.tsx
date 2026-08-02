import React, { useState, useEffect } from 'react';
import { Navigation, MapPin, Mountain, Globe } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { useSettings } from '@/lib/use-settings';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface CompassModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
}

// Region abbreviation dictionaries
const US_STATES: Record<string, string> = {
  "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
  "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA",
  "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
  "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
  "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO",
  "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
  "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT",
  "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
  "District of Columbia": "DC"
};

const CAN_PROVINCES: Record<string, string> = {
  "Ontario": "ON", "British Columbia": "BC", "Quebec": "QC", "Alberta": "AB",
  "Manitoba": "MB", "Saskatchewan": "SK", "Nova Scotia": "NS", "New Brunswick": "NB",
  "Newfoundland and Labrador": "NL", "Prince Edward Island": "PE", "Northwest Territories": "NT",
  "Yukon": "YT", "Nunavut": "NU"
};

const AUS_STATES: Record<string, string> = {
  "New South Wales": "NSW", "Victoria": "VIC", "Queensland": "QLD",
  "Western Australia": "WA", "South Australia": "SA", "Tasmania": "TAS",
  "Australian Capital Territory": "ACT", "Northern Territory": "NT"
};

export function CompassModal({ isOpen, onClose }: CompassModalProps) {
  const { settings } = useSettings();
  const [heading, setHeading] = useState<number | null>(null);
  const [sensorAvailable, setSensorAvailable] = useState<boolean>(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  const [locationName, setLocationName] = useState<string>("Locating...");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [elevation, setElevation] = useState<number | null>(null);

  // Convert heading to 16-point extended cardinal direction
  function getExtendedCardinal(angle: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round((angle % 360) / 22.5);
    return directions[index % 16];
  }

  // Format DMS (Degrees, Minutes, Seconds)
    function formatDMS(lat: number, lon: number) {
      const formatCoord = (val: number, isLat: boolean) => {
        const absolute = Math.abs(val);
        const degrees = Math.floor(absolute);
        const minutesNotTruncated = (absolute - degrees) * 60;
        const minutes = Math.floor(minutesNotTruncated);
        const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
        const direction = isLat ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
        return `${degrees}°${minutes}'${seconds}" ${direction}`;
      };
      return `${formatCoord(lat, true)}, ${formatCoord(lon, false)}`;
    }

  // Format Decimal Coordinates
  function formatDecimal(lat: number, lon: number) {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
  }

  useEffect(() => {
    let absoluteActive = false;

    function handleOrientation(event: DeviceOrientationEvent & { absolute?: boolean; webkitCompassHeading?: number }) {
      if (event.type === 'deviceorientationabsolute') {
        absoluteActive = true;
      } else if (event.type === 'deviceorientation' && absoluteActive) {
        return;
      }

      let currentHeading: number | null = null;

      if (typeof event.webkitCompassHeading === 'number') {
        currentHeading = event.webkitCompassHeading;
      } else if (typeof event.alpha === 'number') {
        currentHeading = event.alpha;
      }

      if (currentHeading !== null) {
        setHeading(currentHeading);
        setSensorAvailable(true);
        setPermissionDenied(false);
      }
    }

    async function fetchElevation(lat: number, lon: number) {
      try {
        const elevRes = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`);
        const elevData = await elevRes.json();
        if (elevData.elevation && typeof elevData.elevation[0] === 'number') {
          setElevation(elevData.elevation[0]);
        } else {
          setElevation(null);
        }
      } catch {
        setElevation(null);
      }
    }

    async function parseLocationDetails(lat: number, lon: number) {
      try {
        const url = new URL('https://nominatim.openstreetmap.org/reverse');
        url.searchParams.set('format', 'jsonv2');
        url.searchParams.set('lat', String(lat));
        url.searchParams.set('lon', String(lon));
        
        const res = await fetch(url.toString(), {
          headers: { 'Accept-Language': 'en' }
        });

        if (res.ok) {
          const data = await res.json();
          const addr = data.address;
          
          if (addr) {
            // Prioritize granular locality details (suburb, neighborhood) before falling back to larger municipalities
            const city = addr.suburb || addr.neighbourhood || addr.city_district || addr.town || addr.city || addr.village || '';
            const rawState = addr.state || addr.region || '';
            let country = addr.country || '';

            if (country === "United States" || country === "United States of America") {
              country = "USA";
            }

            let state = rawState;
            if (country === "USA") {
              state = US_STATES[rawState] || rawState;
            } else if (country === "Canada") {
              state = CAN_PROVINCES[rawState] || rawState;
            } else if (country === "Australia") {
              state = AUS_STATES[rawState] || rawState;
            }

            const locationParts = [city, state, country].filter(Boolean);
            if (locationParts.length > 0) {
              setLocationName(locationParts.join(', '));
              return;
            }
          }
        }
      } catch (error) {
        console.warn("Nominatim geocoding failed, trying fallback:", error);
      }

      try {
        const fallbackUrl = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
        fallbackUrl.searchParams.set('latitude', String(lat));
        fallbackUrl.searchParams.set('longitude', String(lon));
        fallbackUrl.searchParams.set('localityLanguage', 'en');
        
        const res = await fetch(fallbackUrl.toString());
        if (res.ok) {
          const data = await res.json();
          const city = data.suburb || data.locality || data.city || data.principalSubdivision || '';
          const rawState = data.principalSubdivision || '';
          let country = data.countryName || '';

          if (country === "United States" || country === "United States of America") {
            country = "USA";
          }

          let state = rawState;
          if (country === "USA") {
            state = US_STATES[rawState] || rawState;
          } else if (country === "Canada") {
            state = CAN_PROVINCES[rawState] || rawState;
          } else if (country === "Australia") {
            state = AUS_STATES[rawState] || rawState;
          }

          const locationParts = [city, state, country].filter(Boolean);
          if (locationParts.length > 0) {
            setLocationName(locationParts.join(', '));
            return;
          }
        }
      } catch (fallbackError) {
        console.error("All reverse geocoding paths failed:", fallbackError);
      }

      setLocationName('Current Location');
    }

    async function fetchLocationData() {
      try {
        const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const alt = position.coords.altitude;

        setCoords({ lat, lon });

        if (alt !== null && !isNaN(alt) && alt !== 0) {
          setElevation(alt);
        } else {
          await fetchElevation(lat, lon);
        }

        await parseLocationDetails(lat, lon);
      } catch (error) {
        setLocationName("Location unavailable");
        setCoords(null);
        setElevation(null);
      }
    }

    async function startCompass() {
      if (typeof window === 'undefined') return;

      if (!('DeviceOrientationEvent' in window)) {
        setSensorAvailable(false);
        setPermissionDenied(true);
        return;
      }

      if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
        try {
          const response = await (DeviceOrientationEvent as any).requestPermission();
          if (response === 'granted') {
            window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
            window.addEventListener('deviceorientation', handleOrientation as EventListener, true);
          } else {
            setSensorAvailable(false);
            setPermissionDenied(true);
          }
        } catch (error) {
          setSensorAvailable(false);
          setPermissionDenied(true);
        }
      } else {
        window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
        window.addEventListener('deviceorientation', handleOrientation as EventListener, true);
        
        setTimeout(() => {
          if (heading === null) {
            setSensorAvailable(false);
          }
        }, 1000);
      }
    }

    if (isOpen) {
      setHeading(null);
      setSensorAvailable(true);
      setPermissionDenied(false);
      setLocationName("Locating...");
      setCoords(null);
      setElevation(null);
      startCompass();
      fetchLocationData();
    }

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
      window.removeEventListener('deviceorientation', handleOrientation as EventListener, true);
    };
  }, [isOpen]);

  const currentHeadingVal = heading ?? 0;
  const arrowRotation = currentHeadingVal - 45;
  const cardinalText = getExtendedCardinal(currentHeadingVal);

  const elevationUnit = settings.elevationUnit || 'm';
  const displayElevation = elevation !== null 
    ? elevationUnit === 'ft' 
      ? `${Math.round(elevation / 0.3048)} ft` 
      : `${Math.round(elevation)} m`
    : '--';

  const coordinateFormat = settings.coordinateFormat || 'dms';
  const formattedCoords = coords 
    ? (coordinateFormat === 'decimal' ? formatDecimal(coords.lat, coords.lon) : formatDMS(coords.lat, coords.lon))
    : "Coordinates unavailable";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-none shadow-2xl rounded-[2rem] p-6 max-h-[85vh] overflow-hidden flex flex-col">
        <DialogTitle className="text-xl font-bold tracking-tight mb-1">Compass</DialogTitle>

        {/* Compass Dial & Body */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className={`relative w-44 h-44 rounded-full border border-foreground/15 bg-black/[0.02] dark:bg-white/[0.03] flex items-center justify-center mb-6 shadow-inner transition-all duration-300 ${!sensorAvailable ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
            <span className="absolute top-2 text-xs font-bold text-foreground/50 tracking-wider">N</span>
            <span className="absolute bottom-2 text-xs font-bold text-foreground/50 tracking-wider">S</span>
            <span className="absolute left-2 text-xs font-bold text-foreground/50 tracking-wider">W</span>
            <span className="absolute right-2 text-xs font-bold text-foreground/50 tracking-wider">E</span>
            
            <div 
              className="absolute w-full h-full flex items-center justify-center transition-transform duration-75"
              style={{ transform: `rotate(${arrowRotation}deg)` }}
            >
              <Navigation className="w-8 h-8 text-primary fill-primary/20" />
            </div>
          </div>

          {/* Heading Output / Error Message */}
          <div className="text-center space-y-1 mb-6">
            {sensorAvailable ? (
              <div className="text-4xl font-bold tracking-tight">
                {Math.round(currentHeadingVal)}° <span className="text-primary font-medium">{cardinalText}</span>
              </div>
            ) : (
              <p className="text-xs font-medium text-destructive">
                {permissionDenied ? "Compass permissions were not enabled." : "No compass sensors detected on this device."}
              </p>
            )}
          </div>

          {/* Location, Coordinates & Elevation Data block */}
          <div className="w-full bg-black/[0.03] dark:bg-white/[0.03] rounded-2xl p-4 space-y-3 text-sm border border-foreground/5">
            
            {/* Coordinates */}
            <div className="flex items-center gap-2 text-foreground/70">
              <Globe className="w-4 h-4 text-primary shrink-0" />
              <span className="font-mono text-xs truncate">{formattedCoords}</span>
            </div>

            {/* City / Location Name */}
            <div className="flex items-center gap-2 text-foreground/80">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span className="font-medium truncate">{locationName}</span>
            </div>

            {/* Elevation */}
            <div className="flex items-center justify-between pt-1 border-t border-foreground/5">
              <div className="flex items-center gap-2 text-foreground/80">
                <Mountain className="w-4 h-4 text-primary shrink-0" />
                <span>Elevation: <strong className="font-semibold">{displayElevation}</strong></span>
              </div>
            </div>

          </div>

        </div>

      </DialogContent>
    </Dialog>
  );
}