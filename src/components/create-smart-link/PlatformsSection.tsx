
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from "@/lib/utils";
import PlatformItem from './PlatformItem';

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

  const content = platforms.map((platform) => (
    <PlatformItem
      key={platform.id}
      platform={platform}
      onToggle={onToggle}
      onUrlChange={onUrlChange}
      isDraggable={isDraggable}
    />
  ));

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
      <div className={cn(
        "relative",
        isBlurred && "pointer-events-none select-none"
      )}>
        {isBlurred && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center p-4">
              <p className="text-lg font-semibold text-muted-foreground">Pro Feature</p>
              <p className="text-sm text-muted-foreground">Upgrade to access these platforms</p>
            </div>
          </div>
        )}
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
  );
};

export default PlatformsSection;
