import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FELSIUS_UNIT } from '@/lib/units';

interface StickyHeaderProps {
  location: string;
  currentTemp: string | number;
  condition: string;
  isVisible: boolean;
  isCurrent?: boolean; // Matches the `isCurrent` property from useLocations()
}

/**
 * Capitalises only the first letter of a string to enforce sentence casing (e.g., "Clear sky").
 */
const toSentenceCase = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const StickyHeader: React.FC<StickyHeaderProps> = ({
  location,
  currentTemp,
  condition,
  isVisible,
  isCurrent = false,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out border-b border-white/10 dark:border-white/10 bg-background/60 dark:bg-black/40 backdrop-blur-xl shadow-sm pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 px-4 ${
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 -translate-y-2 pointer-events-none'
      }`}
    >
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center text-center gap-0.5">
        {/* Small Compass Rose + Current Location Badge */}
        {isCurrent && (
          <div className="flex items-center justify-center gap-1 text-[11px] font-semibold tracking-widest uppercase text-foreground/60 leading-none mb-0.5">
            <svg
              className="w-3 h-3 text-foreground/70 fill-current relative -top-[1px]"
              viewBox="0 0 24 24"
              style={{ transform: 'rotate(45deg)' }}
            >
              <polygon points="12 2 19 21 12 17 5 21 12 2" />
            </svg>
            <span>Current Location</span>
          </div>
        )}

        {/* City / Location Name - Slightly larger and bolder */}
        <h2 className="text-lg font-semibold tracking-tight text-foreground leading-tight truncate max-w-[80%]">
          {location}
        </h2>

        {/* Sub-header: [Temp]°Ꞓ | [Condition] - Upgraded to text-sm */}
        <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-foreground/80 leading-none mt-0.5">
          <span className="font-semibold text-foreground">
            {currentTemp}{FELSIUS_UNIT}
          </span>
          <span className="text-foreground/40 font-light">|</span>
          <span>{toSentenceCase(condition)}</span>
        </div>
      </div>
    </header>,
    document.body
  );
};