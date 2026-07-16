import { useState } from 'react';

export const useGeolocation = () => {
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [error, setError] = useState<string | null>(null);
  
  // 1. Set initial loading state to false
  const [loading, setLoading] = useState(false); 

  const fetchLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        if (err.code === 1) setError("Location permission denied.");
        else if (err.code === 2) setError("Location unavailable.");
        else if (err.code === 3) setError("Location request timed out.");
        else setError(err.message);
        
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // 2. We removed the useEffect that auto-triggered the fetch!

  return { location, error, loading, fetchLocation };
};