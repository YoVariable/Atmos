import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Snowflake, // <-- Add this line right here!
  type LucideIcon
} from 'lucide-react';

export function getWeatherIcon(code: number, isDay: number): LucideIcon {
  if (code === 0 || code === 1) return isDay ? Sun : Moon;
  if (code === 2) return isDay ? CloudSun : CloudMoon;
  if (code === 3) return Cloud;
  if (code === 45 || code === 48) return CloudFog;
  if (code >= 51 && code <= 57) return CloudDrizzle;
  if (code >= 61 && code <= 65) return CloudRain; // Normal rain stops at 65
  if (code === 66 || code === 67 || (code >= 71 && code <= 77)) return Snowflake; // Freezing rain & Snow
  if (code >= 80 && code <= 82) return CloudRain; // Rain showers
  if (code >= 85 && code <= 86) return Snowflake; // Snow showers
  if (code >= 95 && code <= 99) return CloudLightning;
  return isDay ? Sun : Moon;
}

export function getWeatherColor(code: number, isDay: number): string {
  // Return an rgba color string used for the ambient glow
  if (isDay === 0) {
    if (code >= 95) return 'rgba(100, 50, 150, 0.4)'; // Night storm
    if (code >= 71 && code <= 86) return 'rgba(100, 150, 200, 0.3)'; // Night snow
    return 'rgba(30, 40, 80, 0.4)'; // Clear/Cloudy night
  }
  
  if (code === 0 || code === 1) return 'rgba(255, 170, 0, 0.25)'; // Bright sun
  if (code === 2) return 'rgba(255, 210, 120, 0.2)'; // Partly cloudy
  if (code === 3) return 'rgba(180, 190, 200, 0.3)'; // Overcast
  if (code === 45 || code === 48) return 'rgba(210, 215, 220, 0.4)'; // Fog
  if (code >= 51 && code <= 67) return 'rgba(56, 189, 248, 0.25)'; // Rain
  if (code >= 71 && code <= 77) return 'rgba(224, 242, 254, 0.4)'; // Snow
  if (code >= 80 && code <= 82) return 'rgba(14, 165, 233, 0.3)'; // Rain showers
  if (code >= 85 && code <= 86) return 'rgba(186, 230, 253, 0.4)'; // Snow showers
  if (code >= 95 && code <= 99) return 'rgba(168, 85, 247, 0.3)'; // Thunderstorm
  return 'rgba(200, 200, 200, 0.2)';
}
