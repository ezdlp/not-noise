import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GripVertical } from "lucide-react";
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
  initialData: {
    spotifyUrl: string;
    [key: string]: any;
  };
  onNext: (data: any) => void;
  onBack: () => void;
}

const getPlatformIcon = (platformId: string) => {
  const icons: { [key: string]: string } = {
    spotify: "/lovable-uploads/86f2e670-d045-4ae0-9a45-10f5d5789996.png",
    apple: "/lovable-uploads/b9e12050-d64d-4618-8c2f-e7dde11e3f62.png",
    amazon: "/lovable-uploads/283ad674-b0b0-4752-ac21-7b7101c961eb.png",
    youtube_music: "/lovable-uploads/c78c24b6-a622-4f88-8564-be8a4806f335.png",
    deezer: "/lovable-uploads/e701fd77-eff3-427e-8345-ea16f11445d0.png",
    soundcloud: "/lovable-uploads/2faf54d9-c033-4184-ac62-50579c3f0a0a.png",
    youtube: "/lovable-uploads/c78c24b6-a622-4f88-8564-be8a4806f335.png",
    itunes: "/lovable-uploads/952e775d-162e-4c42-8356-5b4214084a49.png",
    tidal: "/lovable-uploads/86636298-b9cc-4920-befc-47a8080f725d.png",
    anghami: "/lovable-uploads/9e0bd143-b390-4507-95bb-4608c17e614a.png",
    napster: "/lovable-uploads/9d6f3e19-6eae-4463-a38e-12484ceb9fbb.png",
    boomplay: "/lovable-uploads/4fecc791-6ea7-4737-aa0f-0a3c2c8aa7b3.png",
    yandex: "/lovable-uploads/39a6879b-3c04-4dae-b21d-e7c9c538ffc3.png",
    beatport: "/lovable-uploads/876fdc17-4519-43ce-9587-637f5acc5d67.png",
    bandcamp: "/lovable-uploads/28f75700-3d24-45a7-8bca-02635c910bf8.png",
    audius: "/lovable-uploads/f4e0cb13-a577-4efd-8e18-3b6602ff1093.png",
  };
  return icons[platformId] || "/lovable-uploads/952e775d-162e-4c42-8356-5b4214084a49.png";
};

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
      className="bg-white p-4 rounded-lg shadow-sm mb-2 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center gap-4">
        <div {...attributes} {...listeners} className="cursor-grab hover:opacity-70">
          <GripVertical className="text-gray-400" />
        </div>
        <div className="flex items-center gap-3 flex-1">
          <img 
            src={getPlatformIcon(platform.id)} 
            alt={`${platform.name} logo`}
            className="w-8 h-8 object-contain"
          />
          <span className="ml-2 text-sm font-medium">{platform.name}</span>
          <div className="ml-auto">
            <Button
              variant={platform.enabled ? "default" : "outline"}
              onClick={() => onToggle(platform.id)}
              disabled={platform.id === "spotify"}
              className={`min-w-[100px] group hover:bg-red-500 hover:border-red-500 ${
                platform.enabled ? "" : "hover:bg-primary hover:border-primary"
              }`}
            >
              <span className="group-hover:hidden">
                {platform.enabled ? "Enabled" : "Disabled"}
              </span>
              <span className="hidden group-hover:inline">
                {platform.enabled ? "Disable" : "Enable"}
              </span>
            </Button>
          </div>
        </div>
      </div>
      {platform.enabled && (
        <Input
          value={platform.url}
          onChange={(e) => onUrlChange(platform.id, e.target.value)}
          className="mt-4"
          placeholder={`Enter ${platform.name} URL manually...`}
        />
      )}
    </div>
  );
};

const PlatformsStep = ({ initialData, onNext, onBack }: PlatformsStepProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [platforms, setPlatforms] = useState<Platform[]>([
    { id: "spotify", name: "Spotify", enabled: true, url: initialData.spotifyUrl, icon: "/lovable-uploads/86f2e670-d045-4ae0-9a45-10f5d5789996.png" },
    { id: "apple", name: "Apple Music", enabled: true, url: "", icon: "/lovable-uploads/b9e12050-d64d-4618-8c2f-e7dde11e3f62.png" },
    { id: "amazon", name: "Amazon Music", enabled: true, url: "", icon: "/lovable-uploads/283ad674-b0b0-4752-ac21-7b7101c961eb.png" },
    { id: "youtube_music", name: "YouTube Music", enabled: true, url: "", icon: "/lovable-uploads/c78c24b6-a622-4f88-8564-be8a4806f335.png" },
    { id: "deezer", name: "Deezer", enabled: true, url: "", icon: "/lovable-uploads/e701fd77-eff3-427e-8345-ea16f11445d0.png" },
    { id: "soundcloud", name: "SoundCloud", enabled: true, url: "", icon: "/lovable-uploads/2faf54d9-c033-4184-ac62-50579c3f0a0a.png" },
    { id: "youtube", name: "YouTube", enabled: true, url: "", icon: "/lovable-uploads/c78c24b6-a622-4f88-8564-be8a4806f335.png" },
    { id: "itunes", name: "iTunes", enabled: true, url: "", icon: "/lovable-uploads/952e775d-162e-4c42-8356-5b4214084a49.png" },
  ]);

  const [additionalPlatforms, setAdditionalPlatforms] = useState<Platform[]>([
    { id: "tidal", name: "Tidal", enabled: false, url: "", icon: "/lovable-uploads/86636298-b9cc-4920-befc-47a8080f725d.png" },
    { id: "anghami", name: "Anghami", enabled: false, url: "", icon: "/lovable-uploads/9e0bd143-b390-4507-95bb-4608c17e614a.png" },
    { id: "napster", name: "Napster", enabled: false, url: "", icon: "/lovable-uploads/9d6f3e19-6eae-4463-a38e-12484ceb9fbb.png" },
    { id: "boomplay", name: "Boomplay", enabled: false, url: "", icon: "/lovable-uploads/4fecc791-6ea7-4737-aa0f-0a3c2c8aa7b3.png" },
    { id: "yandex", name: "Yandex Music", enabled: false, url: "", icon: "/lovable-uploads/39a6879b-3c04-4dae-b21d-e7c9c538ffc3.png" },
    { id: "beatport", name: "Beatport", enabled: false, url: "", icon: "/lovable-uploads/876fdc17-4519-43ce-9587-637f5acc5d67.png" },
    { id: "bandcamp", name: "Bandcamp", enabled: false, url: "", icon: "/lovable-uploads/28f75700-3d24-45a7-8bca-02635c910bf8.png" },
    { id: "audius", name: "Audius", enabled: false, url: "", icon: "/lovable-uploads/f4e0cb13-a577-4efd-8e18-3b6602ff1093.png" },
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
