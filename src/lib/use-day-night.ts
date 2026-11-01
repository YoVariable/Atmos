import { useState, useEffect } from 'react';
import * as SunCalc from 'suncalc';

export function useDayNight(lat: number, lng: number, timezone?: string) {
  const [isDay, setIsDay] = useState(true);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const times = SunCalc.getTimes(now, lat, lng);

      // SAFETY CHECK: Handle polar regions or missing times where sunrise/sunset are null/undefined
      if (!times.sunrise || !times.sunset || isNaN(times.sunrise.getTime()) || isNaN(times.sunset.getTime())) {
        const position = SunCalc.getPosition(now, lat, lng);
        setIsDay(position.altitude > 0);
        return;
      }

      const nowTime = now.getTime();
      setIsDay(nowTime >= times.sunrise.getTime() && nowTime <= times.sunset.getTime());
    };

    checkTime(); // Run immediately
    const interval = setInterval(checkTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [lat, lng, timezone]);

  return { isDay };
}