import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FELSIUS_UNIT } from '@/lib/units';

interface StickyHeaderProps {
  location: string;
  currentTemp: string | number;
  condition: string;
  isVisible: boolean;
  isCurrent?: boolean;
}

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
    <div
      style={{
        zIndex: 30, // Lowered from 9999 so bottom sheets (z-40/z-50) stack above it
        isolation: 'isolate',
      }}
      className={`fixed top-0 left-0 right-0 flex justify-center pointer-events-none transition-all duration-300 ease-out pt-[max(env(safe-area-inset-top),3.5rem)] ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="pointer-events-auto w-[calc(100%-2rem)] max-w-md mx-auto">
        <header 
          style={{
            WebkitBackdropFilter: 'blur(16px)',
            backdropFilter: 'blur(16px)',
          }}
          className="py-2.5 px-5 flex flex-col items-center justify-center text-center gap-0.5 rounded-full border border-black/15 dark:border-white/20 bg-card/95 dark:bg-zinc-950/95 shadow-2xl relative"
        >
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

          <h2 className="text-lg font-semibold tracking-tight text-foreground leading-tight truncate max-w-[90%]">
            {location}
          </h2>

          <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-foreground/80 leading-none mt-0.5">
            <span className="font-semibold text-foreground">
              {currentTemp}{FELSIUS_UNIT}
            </span>
            <span className="text-foreground/40 font-light">|</span>
            <span>{toSentenceCase(condition)}</span>
          </div>
        </header>
      </div>
    </div>,
    document.body
  );
};