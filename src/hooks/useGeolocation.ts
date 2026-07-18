import { useState } from 'react';
import { Geolocation } from '@capacitor/geolocation'; // Import Capacitor Geolocation

export const useGeolocation = () => {
  const [location, setLocation] = useState({ latitude: null as number | null, longitude: null as number | null });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLocation = async () => { // Make this async
    setLoading(true);
    setError(null);

    try {
      // 1. Explicitly request permissions (triggers your new Info.plist strings)
      const permStatus = await Geolocation.requestPermissions();
      
      if (permStatus.location !== 'granted') {
        throw new Error('Location permission denied.');
      }

      // 2. Fetch position using Capacitor
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to get location.');
    } finally {
      setLoading(false);
    }
  };

  return { location, error, loading, fetchLocation };
};