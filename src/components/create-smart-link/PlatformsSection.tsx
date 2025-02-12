
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from "@/lib/utils";
import PlatformItem from './PlatformItem';
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface Platform {
  id: string;
  name: string;
  enabled: boolean;
  url: string;
  icon: string;
}

interface PlatformsSectionProps {
  title: string;
  description?: string;
  platforms: Platform[];
  onToggle: (id: string) => void;
  onUrlChange: (id: string, url: string) => void;
  onDragEnd?: (event: any) => void;
  isDraggable?: boolean;
  isBlurred?: boolean;
}

const PlatformsSection = ({ 
  title, 
  description, 
  platforms, 
  onToggle, 
  onUrlChange, 
  onDragEnd,
  isDraggable = false,
  isBlurred = false,
}: PlatformsSectionProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const content = platforms.map((platform, index) => (
    <div 
      key={platform.id}
      className={cn(
        "relative",
        isBlurred && index > 2 && "opacity-60"
      )}
    >
      <PlatformItem
        platform={platform}
        onToggle={onToggle}
        onUrlChange={onUrlChange}
        isDraggable={isDraggable}
      />
      {platform.isPremium && (
        <div className="absolute right-0 top-0 -translate-y-1/2 translate-x-2">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
      )}
    </div>
  ));

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {isBlurred && (
          <div className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded-full">
            Used by 2000+ artists
          </div>
        )}
      </div>
      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
      <div className={cn(
        "relative rounded-lg border bg-card",
        isBlurred && "pointer-events-none select-none"
      )}>
        {isBlurred && (
          <div className="absolute inset-0 z-10">
            {/* Gradient overlay that gets more intense towards the bottom */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/50 to-background/80 backdrop-blur-[2px]" />
            
            {/* Centered upgrade content */}
            <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center justify-center text-center">
              <h4 className="text-xl font-semibold mb-2">Unlock All Platforms</h4>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Get access to all premium music platforms and reach a wider audience
              </p>
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-semibold px-8"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggle("upgrade");
                }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            </div>
          </div>
        )}
        <div className="p-4 space-y-4">
          {isDraggable && onDragEnd ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={platforms}
                strategy={verticalListSortingStrategy}
              >
                {content}
              </SortableContext>
            </DndContext>
          ) : (
            content
          )}
        </div>
      </div>
    </div>
  );
};

export default PlatformsSection;
