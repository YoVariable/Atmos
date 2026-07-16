import { useState, useEffect } from 'react';
import { useCitySearch } from '@/lib/use-weather';
import { MapPin, Search, Loader2, Navigation } from 'lucide-react';
import type { SavedLocation } from '@/lib/use-locations';

interface LocationSearchProps {
  onSelect: (location: SavedLocation) => void;
  onUseCurrentLocation?: () => void;
  isLocatingCurrent?: boolean;
}

export function LocationSearch({ onSelect, onUseCurrentLocation, isLocatingCurrent }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { data: results, isFetching } = useCitySearch(debouncedQuery);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="w-full space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search for a city..."
          className="w-full pl-11 pr-11 py-3.5 bg-black/5 border-none rounded-2xl text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground text-foreground"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {isFetching && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {onUseCurrentLocation && (
        <button
          onClick={onUseCurrentLocation}
          disabled={isLocatingCurrent}
          className="w-full flex items-center gap-3 px-4 py-3.5 bg-white/60 hover:bg-white text-foreground rounded-2xl text-[15px] font-semibold transition-all disabled:opacity-50 group"
        >
          {isLocatingCurrent ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <Navigation className="w-4 h-4 text-primary group-hover:fill-primary transition-all" />
          )}
          Use Current Location
        </button>
      )}

      {results && results.length > 0 && (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm ring-1 ring-black/5">
          <div className="max-h-[250px] overflow-y-auto scrollbar-hide">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => onSelect(result)}
                className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-black/5 transition-colors border-b border-black/5 last:border-0"
              >
                <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-foreground/60" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[15px] truncate">{result.name}</div>
                  <div className="text-sm font-medium text-muted-foreground truncate">
                    {result.admin1 ? `${result.admin1}, ` : ''}{result.country}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}