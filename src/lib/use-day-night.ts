import { useState, useEffect } from 'react';
import * as SunCalc from 'suncalc';

export function useDayNight(lat: number, lng: number, timezone?: string) {
  const [isDay, setIsDay] = useState(true);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      
      // Shift the date to the target city's timezone to handle midnight rollovers
      let targetDate = now;
      if (timezone) {
        try {
          // Creates a string of the local time in the target city, then parses it
          const tzString = now.toLocaleString('en-US', { timeZone: timezone });
          targetDate = new Date(tzString);
        } catch (e) {
          console.warn("Invalid timezone string, falling back to local time");
        }
      }

      // Calculate sun times for that specific calendar day
      const times = SunCalc.getTimes(targetDate, lat, lng);

      // SAFETY CHECK: Handle polar regions where the sun doesn't set/rise
      if (!times.sunrise || !times.sunset) {
        setIsDay(true);
        return;
      }

      setIsDay(targetDate >= times.sunrise && targetDate <= times.sunset);
    };

    checkTime(); // Run immediately
    const interval = setInterval(checkTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [lat, lng, timezone]);

  return { isDay };
}