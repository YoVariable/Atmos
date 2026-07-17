import { useLocations } from '@/lib/use-locations';
import { LocationManager } from '@/components/location-manager';
import { SettingsManager } from '@/components/settings-manager';
import { InfoManager } from '@/components/info-manager';
import { WeatherDisplay } from '@/components/weather-display';
import { LocationSearch } from '@/components/location-search';
import { Compass, Navigation } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';

export default function Home() {
  const { locations, activeLocationId, setActiveLocationId, isLoaded, addLocation, refreshCurrentLocation, isLocatingCurrent } =
    useLocations();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Sync scroll to activeLocationId when it changes externally
  useEffect(() => {
    if (!scrollRef.current || activeLocationId === null) return;
    const index = locations.findIndex(l => l.id === activeLocationId);
    if (index !== -1 && index !== activeIndex) {
      const el = scrollRef.current;
      el.scrollTo({
        left: index * el.clientWidth,
        behavior: 'smooth'
      });
      setActiveIndex(index);
    }
  }, [activeLocationId, locations, activeIndex]);

  // Handle scroll events to update active index
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const clientWidth = scrollRef.current.clientWidth;
    if (clientWidth === 0) return;
    
    const index = Math.round(scrollRef.current.scrollLeft / clientWidth);
    if (index !== activeIndex && index >= 0 && index < locations.length) {
      setActiveIndex(index);
      setActiveLocationId(locations[index].id);
    }
  }, [activeIndex, locations, setActiveLocationId]);

  if (!isLoaded) return null;

  return (
    <div className="h-[100dvh] w-full relative overflow-hidden bg-background selection:bg-primary/20 flex flex-col">
      <div id="ambient-glow" className="ambient-glow" />
      
      {locations.length > 0 ? (
        <>
          <main 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-x-auto overflow-y-hidden snap-x snap-mandatory flex scrollbar-hide"
            style={{ scrollBehavior: 'smooth' }}
          >
            {locations.map((loc) => (
              <div key={loc.id} className="w-screen h-full shrink-0 snap-center overflow-y-auto scrollbar-hide">
                <WeatherDisplay location={loc} isActive={loc.id === activeLocationId} />
              </div>
            ))}
          </main>

          {/* Footer Pager / Nav */}
          <footer className="h-16 shrink-0 flex items-center justify-between px-6 z-20 relative">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-2xl border-t border-black/[0.03] pointer-events-none" />
            
            <div className="flex-1 flex items-center gap-2 relative z-10">
              <Compass className="w-5 h-5 text-foreground/80" />
              <SettingsManager />
              <div className="-ml-2">
              <InfoManager />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2.5 flex-1 relative z-10">
              {locations.map((loc, i) => (
                <div 
                  key={loc.id}
                  className="flex items-center justify-center transition-all duration-300"
                >
                  {loc.isCurrent ? (
                    <Navigation 
                      className={`w-3.5 h-3.5 transition-all duration-300 ${
                        i === activeIndex ? "text-foreground fill-current" : "text-foreground/30"
                      }`} 
                    />
                  ) : (
                    <div 
                      className={`rounded-full transition-all duration-300 ${
                        i === activeIndex 
                          ? "w-2 h-2 bg-foreground" 
                          : "w-1.5 h-1.5 bg-foreground/30"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex-1 flex justify-end relative z-10">
              <LocationManager />
            </div>
          </footer>
        </>
      ) : (
        <main className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full p-6 space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-primary mx-auto mb-6 flex items-center justify-center shadow-sm">
              <Compass className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Precise. Calm. Yours.</h1>
            <p className="text-muted-foreground text-sm font-medium">
              Search for a city or use your location to begin reading the instruments.
            </p>
          </div>
          
          <LocationSearch
            onSelect={addLocation}
            onUseCurrentLocation={() => refreshCurrentLocation({ makeActive: true })}
            isLocatingCurrent={isLocatingCurrent}
          />
        </main>
      )}
    </div>
  );
}