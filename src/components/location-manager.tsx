import { useState } from 'react';
import { useLocations } from '@/lib/use-locations';
import { LocationSearch } from './location-search';
import { List, X, Navigation } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';

export function LocationManager() {
  const {
    locations,
    activeLocationId,
    setActiveLocationId,
    removeLocation,
    addLocation,
    refreshCurrentLocation,
    isLocatingCurrent,
  } = useLocations();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="p-2 -mr-2 rounded-full hover:bg-black/5 transition-colors text-foreground/80 hover:text-foreground">
          <List className="w-6 h-6" />
        </button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-none shadow-2xl rounded-[2rem] p-6 max-h-[85vh] overflow-hidden flex flex-col">
        <DialogTitle className="text-xl font-medium tracking-tight mb-4">Locations</DialogTitle>
        
        <div className="flex-1 overflow-y-auto space-y-6 pb-2 pr-2 scrollbar-hide">
          <LocationSearch
            onSelect={(loc) => {
              addLocation(loc);
              setIsOpen(false);
            }}
            onUseCurrentLocation={() => {
              refreshCurrentLocation({ makeActive: true });
              setIsOpen(false);
            }}
            isLocatingCurrent={isLocatingCurrent}
          />

          {locations.length > 0 && (
            <div className="space-y-3">
              {locations.map(loc => (
                <div 
                  key={loc.id}
                  className={`group flex items-center justify-between p-4 rounded-[1.25rem] transition-all cursor-pointer ${
                    activeLocationId === loc.id 
                      ? "bg-white shadow-sm ring-1 ring-black/5" 
                      : "bg-white/40 hover:bg-white/80"
                  }`}
                  onClick={() => {
                    setActiveLocationId(loc.id);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex-1 text-left min-w-0 pr-4">
                    <div className="font-semibold text-lg tracking-tight flex items-center gap-2 truncate">
                      {loc.name}
                      {loc.isCurrent && <Navigation className="w-3.5 h-3.5 text-primary shrink-0 fill-current" />}
                    </div>
                    <div className="text-sm font-medium text-muted-foreground truncate mt-0.5">
                      {loc.isCurrent ? 'Current Location' : loc.country}
                    </div>
                  </div>
                  {!loc.isCurrent && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLocation(loc.id);
                      }}
                      className="p-2 -mr-2 text-muted-foreground opacity-70 hover:opacity-100 hover:text-destructive hover:bg-destructive/10 rounded-full transition-all"
                      aria-label="Remove location"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}