import { useState } from 'react';
import { useLocations, SavedLocation } from '@/lib/use-locations';
import { LocationSearch } from './location-search';
import { List, X, Navigation, MinusCircle, Menu } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import {
  DndContext,
  closestCenter,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableLocationItemProps {
  loc: SavedLocation;
  activeLocationId: number | null;
  setActiveLocationId: (id: number) => void;
  setIsOpen: (isOpen: boolean) => void;
  removeLocation: (id: number) => void;
  isEditing: boolean;
}

// Extracted sub-component to handle individual sortable rows
function SortableLocationItem({ loc, activeLocationId, setActiveLocationId, setIsOpen, removeLocation, isEditing }: SortableLocationItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ 
    id: loc.id,
    disabled: !isEditing || loc.isCurrent, // Prevents dragging when not in edit mode, or if it's the current location
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between p-4 rounded-[1.25rem] transition-all ${
        activeLocationId === loc.id && !isEditing
          ? "bg-white shadow-sm ring-1 ring-black/5"
          : "bg-white/40 hover:bg-white/80"
      } ${isEditing ? "cursor-default" : "cursor-pointer"}`}
      onClick={() => {
        if (!isEditing) {
          setActiveLocationId(loc.id);
          setIsOpen(false);
        }
      }}
    >
      {/* APPLE STYLE: Red Delete Button on the Left in Edit Mode */}
      {isEditing && !loc.isCurrent && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeLocation(loc.id);
          }}
          className="mr-4 text-red-500 hover:text-red-600 transition-colors"
          aria-label="Remove location"
        >
          <MinusCircle className="w-6 h-6 fill-red-500 text-white" />
        </button>
      )}

      {/* CENTER: Location Info */}
      <div className="flex-1 text-left min-w-0 pr-4">
        <div className="font-semibold text-lg tracking-tight flex items-center gap-2 truncate">
          {loc.name}
          {loc.isCurrent && <Navigation className="w-3.5 h-3.5 text-primary shrink-0 fill-current" />}
        </div>
        <div className="text-sm font-medium text-muted-foreground truncate mt-0.5">
          {loc.isCurrent ? 'Current Location' : loc.country}
        </div>
      </div>

      {/* RIGHT SIDE: Drag Handle (Edit Mode) OR standard delete (Normal View) */}
      {isEditing ? (
        !loc.isCurrent && (
          <div
            {...attributes}
            {...listeners}
            className="p-2 -mr-2 touch-none cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-foreground/70"
          >
            <Menu className="w-6 h-6" />
          </div>
        )
      ) : (
        !loc.isCurrent && (
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
        )
      )}
    </div>
  );
}

export function LocationManager() {
  const {
    locations,
    activeLocationId,
    setActiveLocationId,
    removeLocation,
    addLocation,
    refreshCurrentLocation,
    isLocatingCurrent,
    updateLocations // Make sure to add this array-setter to your useLocations hook!
  } = useLocations();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Configure touch/mouse sensors for mobile drag-and-drop
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = locations.findIndex((loc: any) => loc.id === active.id);
      const newIndex = locations.findIndex((loc: any) => loc.id === over.id);
      
      const reorderedArray = arrayMove(locations, oldIndex, newIndex);
      updateLocations(reorderedArray); 
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) setIsEditing(false); // Reset edit state when closing the dialog
    }}>
      <DialogTrigger asChild>
        <button className="p-2 -mr-2 rounded-full hover:bg-black/5 transition-colors text-foreground/80 hover:text-foreground">
          <List className="w-6 h-6" />
        </button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-none shadow-2xl rounded-[2rem] p-6 max-h-[85vh] overflow-hidden flex flex-col">
        
        {/* HEADER AREA: Title and Edit Toggle */}
        <div className="flex items-center justify-between mb-4">
          <DialogTitle className="mt-7 text-xl font-medium tracking-tight">Locations</DialogTitle>
          {locations.length > 1 && (
             <button 
               onClick={() => setIsEditing(!isEditing)}
               className="mt-7 mr-0 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
             >
               {isEditing ? 'Done' : 'Edit List'}
             </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-6 pb-2 pr-2 scrollbar-hide">
          {!isEditing && (
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
          )}

          {locations.length > 0 && (
            <div className="space-y-3">
              <DndContext 
                sensors={sensors} 
                collisionDetection={closestCenter} 
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={locations} strategy={verticalListSortingStrategy}>
                  {locations.map(loc => (
                    <SortableLocationItem
                      key={loc.id}
                      loc={loc}
                      activeLocationId={activeLocationId}
                      setActiveLocationId={setActiveLocationId}
                      setIsOpen={setIsOpen}
                      removeLocation={removeLocation}
                      isEditing={isEditing}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}