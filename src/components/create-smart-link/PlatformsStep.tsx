import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Music, 
  Youtube, 
  Apple,
  Loader2
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface Platform {
  id: string;
  name: string;
  enabled: boolean;
  url: string;
  icon: React.ReactNode;
}

interface PlatformsStepProps {
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

const SortablePlatform = ({ platform, onToggle, onUrlChange }: { 
  platform: Platform; 
  onToggle: (id: string) => void;
  onUrlChange: (id: string, url: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: platform.id });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    transition,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} className="bg-white p-4 rounded-lg shadow-sm mb-2 cursor-move" {...attributes} {...listeners}>
      <div className="flex items-center space-x-2 mb-2">
        <div className="w-6 h-6">
          {platform.icon}
        </div>
        <Checkbox
          id={platform.id}
          checked={platform.enabled}
          onCheckedChange={() => onToggle(platform.id)}
          disabled={platform.id === "spotify"}
        />
        <Label htmlFor={platform.id}>{platform.name}</Label>
      </div>
      {platform.enabled && (
        <Input
          placeholder={`Enter ${platform.name} URL...`}
          value={platform.url}
          onChange={(e) => onUrlChange(platform.id, e.target.value)}
          className="mt-2"
        />
      )}
    </div>
  );
};

const PlatformsStep = ({ initialData, onNext, onBack }: PlatformsStepProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [platforms, setPlatforms] = useState<Platform[]>([
    { id: "spotify", name: "Spotify", enabled: true, url: initialData.spotifyUrl, icon: <Music className="text-green-500" /> },
    { id: "apple", name: "Apple Music", enabled: false, url: "", icon: <Apple className="text-gray-900" /> },
    { id: "youtube", name: "YouTube Music", enabled: false, url: "", icon: <Youtube className="text-red-500" /> },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchOdesliLinks = async () => {
      if (!initialData.spotifyUrl) return;

      setIsLoading(true);
      try {
        const response = await fetch(`https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(initialData.spotifyUrl)}`);
        const data = await response.json();

        setPlatforms(prev => prev.map(platform => {
          let url = "";
          if (platform.id === "apple" && data.linksByPlatform.appleMusic) {
            url = data.linksByPlatform.appleMusic.url;
          } else if (platform.id === "youtube" && data.linksByPlatform.youtubeMusic) {
            url = data.linksByPlatform.youtubeMusic.url;
          }
          return {
            ...platform,
            enabled: !!url,
            url: url || platform.url,
          };
        }));
      } catch (error) {
        console.error("Error fetching Odesli links:", error);
        toast.error("Failed to fetch streaming links. Please add them manually.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOdesliLinks();
  }, [initialData.spotifyUrl]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setPlatforms((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const togglePlatform = (platformId: string) => {
    setPlatforms(
      platforms.map((p) =>
        p.id === platformId ? { ...p, enabled: !p.enabled } : p
      )
    );
  };

  const updateUrl = (platformId: string, url: string) => {
    setPlatforms(
      platforms.map((p) => (p.id === platformId ? { ...p, url } : p))
    );
  };

  const handleNext = () => {
    const enabledPlatforms = platforms.filter((p) => p.enabled);
    if (!enabledPlatforms.some((p) => p.url)) {
      toast.error("Please add at least one platform URL");
      return;
    }
    
    onNext({
      ...initialData,
      platforms: enabledPlatforms,
    });
    toast.success("Platforms saved!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading streaming links...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Manage Platforms</h2>
        <p className="text-sm text-muted-foreground">
          Add your music links for each platform. Drag to reorder.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={platforms}
          strategy={verticalListSortingStrategy}
        >
          {platforms.map((platform) => (
            <SortablePlatform
              key={platform.id}
              platform={platform}
              onToggle={togglePlatform}
              onUrlChange={updateUrl}
            />
          ))}
        </SortableContext>
      </DndContext>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!platforms.some((p) => p.enabled && p.url)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default PlatformsStep;