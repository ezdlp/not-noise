import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Music,
  GripVertical,
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
  icon: string;
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
    <div 
      ref={setNodeRef} 
      style={style} 
      className="bg-white p-4 rounded-lg shadow-sm mb-2 hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-center gap-4">
        <div {...attributes} {...listeners} className="cursor-grab hover:opacity-70">
          <GripVertical className="text-gray-400" />
        </div>
        <div className="flex items-center gap-3 flex-1">
          <img 
            src={platform.icon} 
            alt={`${platform.name} logo`} 
            className="w-12 h-12 object-contain"
          />
          <div className="ml-auto">
            <Button
              variant={platform.enabled ? "default" : "outline"}
              onClick={() => onToggle(platform.id)}
              disabled={platform.id === "spotify"}
              className="min-w-[100px]"
            >
              {platform.enabled ? "Enabled" : "Disabled"}
            </Button>
          </div>
        </div>
      </div>
      {platform.enabled && (
        <Input
          value={platform.url}
          onChange={(e) => onUrlChange(platform.id, e.target.value)}
          className="mt-4"
          placeholder={platform.url ? undefined : `Enter ${platform.name} URL manually...`}
        />
      )}
    </div>
  );
};

const PlatformsStep = ({ initialData, onNext, onBack }: PlatformsStepProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [platforms, setPlatforms] = useState<Platform[]>([
    { id: "spotify", name: "Spotify", enabled: true, url: initialData.spotifyUrl, icon: "/lovable-uploads/1774db88-cf22-42a3-ae4e-f569d084758b.png" },
    { id: "apple", name: "Apple Music", enabled: false, url: "", icon: "/lovable-uploads/525c74dd-2e67-4591-868b-3a20ec72bb1b.png" },
    { id: "amazon", name: "Amazon Music", enabled: false, url: "", icon: "/lovable-uploads/3307f3ee-5e9f-4d5c-98df-d81e826dadb2.png" },
    { id: "youtube_music", name: "YouTube Music", enabled: false, url: "", icon: "/lovable-uploads/4510bd60-a8a4-4c06-8850-3ecd456bd61c.png" },
    { id: "deezer", name: "Deezer", enabled: false, url: "", icon: "/lovable-uploads/8fd0c910-5818-42d5-8b7c-28687de751f0.png" },
    { id: "tidal", name: "Tidal", enabled: false, url: "", icon: "/lovable-uploads/4c9eb575-58f0-4d5e-9109-0fe49ff42c02.png" },
    { id: "soundcloud", name: "SoundCloud", enabled: false, url: "", icon: "/lovable-uploads/784c6037-6e3d-4a29-8283-6779b3e8614b.png" },
    { id: "youtube", name: "YouTube", enabled: false, url: "", icon: "/lovable-uploads/4510bd60-a8a4-4c06-8850-3ecd456bd61c.png" },
    { id: "itunes", name: "iTunes", enabled: false, url: "", icon: "/lovable-uploads/12904552-0e7f-4be4-b8fe-9da870581acd.png" },
  ]);

  const [additionalPlatforms, setAdditionalPlatforms] = useState<Platform[]>([
    { id: "anghami", name: "Anghami", enabled: false, url: "", icon: "/lovable-uploads/dce36b1c-1b3e-44a4-9f09-ada4ea475cd4.png" },
    { id: "napster", name: "Napster", enabled: false, url: "", icon: "/lovable-uploads/d16e78a9-e41f-466c-a339-e293d03110ba.png" },
    { id: "boomplay", name: "Boomplay", enabled: false, url: "", icon: "/lovable-uploads/c564128e-b594-4909-8fb2-5f1e98cbe6cc.png" },
    { id: "yandex", name: "Yandex Music", enabled: false, url: "", icon: "/lovable-uploads/398fda54-f8aa-4b4e-ad28-984135ded1c8.png" },
    { id: "beatport", name: "Beatport", enabled: false, url: "", icon: "/lovable-uploads/beatport.png" },
    { id: "bandcamp", name: "Bandcamp", enabled: false, url: "", icon: "/lovable-uploads/bandcamp.png" },
    { id: "audius", name: "Audius", enabled: false, url: "", icon: "/lovable-uploads/audius.png" },
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
        const { data, error } = await supabase.functions.invoke('get-odesli-links', {
          body: { url: initialData.spotifyUrl }
        });

        if (error) {
          throw new Error(error.message);
        }

        setPlatforms(prev => prev.map(platform => {
          let url = "";
          switch (platform.id) {
            case "spotify":
              url = initialData.spotifyUrl;
              break;
            case "apple":
              url = data.linksByPlatform.appleMusic?.url || "";
              break;
            case "youtube_music":
              url = data.linksByPlatform.youtubeMusic?.url || "";
              break;
            case "amazon":
              url = data.linksByPlatform.amazonMusic?.url || "";
              break;
            case "deezer":
              url = data.linksByPlatform.deezer?.url || "";
              break;
            case "tidal":
              url = data.linksByPlatform.tidal?.url || "";
              break;
            case "soundcloud":
              url = data.linksByPlatform.soundcloud?.url || "";
              break;
            case "youtube":
              url = data.linksByPlatform.youtube?.url || "";
              break;
            case "itunes":
              url = data.linksByPlatform.itunes?.url || "";
              break;
          }
          return {
            ...platform,
            enabled: platform.id === "spotify" ? true : !!url,
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
    // Check if the platform is in additionalPlatforms
    const additionalPlatform = additionalPlatforms.find(p => p.id === platformId);
    if (additionalPlatform) {
      // If enabling an additional platform, move it to platforms
      if (!additionalPlatform.enabled) {
        setPlatforms(prev => [...prev, { ...additionalPlatform, enabled: true }]);
        setAdditionalPlatforms(prev => prev.filter(p => p.id !== platformId));
      }
    } else {
      // Toggle existing platform
      setPlatforms(
        platforms.map((p) =>
          p.id === platformId ? { ...p, enabled: !p.enabled } : p
        )
      );
    }
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Manage Platforms</h2>
        <p className="text-sm text-muted-foreground">
          Drag to reorder platforms and enable the ones you want to include.
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

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Additional Services</h3>
        {additionalPlatforms.map((platform) => (
          <div key={platform.id} className="bg-white p-4 rounded-lg shadow-sm mb-2 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-3">
              <img 
                src={platform.icon} 
                alt={`${platform.name} logo`} 
                className="w-12 h-12 object-contain"
              />
              <div className="ml-auto">
                <Button
                  variant={platform.enabled ? "default" : "outline"}
                  onClick={() => togglePlatform(platform.id)}
                  className="min-w-[100px]"
                >
                  {platform.enabled ? "Enabled" : "Disabled"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

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