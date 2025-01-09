import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GripVertical } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faSpotify, 
  faApple, 
  faAmazon, 
  faYoutube, 
  faSoundcloud,
  faDeezer,
  faTidal,
  faAnghami,
  faNapster,
  faBoomplay,
  faYandex,
} from "@fortawesome/free-brands-svg-icons";
import { faMusic } from "@fortawesome/free-solid-svg-icons";
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
  icon: any;
}

const getPlatformIcon = (platformId: string) => {
  switch (platformId) {
    case "spotify": return faSpotify;
    case "apple": return faApple;
    case "amazon": return faAmazon;
    case "youtube_music": return faYoutube;
    case "deezer": return faDeezer;
    case "tidal": return faTidal;
    case "soundcloud": return faSoundcloud;
    case "youtube": return faYoutube;
    case "itunes": return faApple;
    case "anghami": return faMusic;
    case "napster": return faMusic;
    case "boomplay": return faMusic;
    case "yandex": return faMusic;
    case "beatport": return faMusic;
    case "bandcamp": return faMusic;
    case "audius": return faMusic;
    default: return faMusic;
  }
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
          <FontAwesomeIcon 
            icon={getPlatformIcon(platform.id)} 
            className="text-3xl"
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
    { id: "spotify", name: "Spotify", enabled: true, url: initialData.spotifyUrl, icon: faSpotify },
    { id: "apple", name: "Apple Music", enabled: true, url: "", icon: faApple },
    { id: "amazon", name: "Amazon Music", enabled: true, url: "", icon: faAmazon },
    { id: "youtube_music", name: "YouTube Music", enabled: true, url: "", icon: faYoutube },
    { id: "deezer", name: "Deezer", enabled: true, url: "", icon: faDeezer },
    { id: "tidal", name: "Tidal", enabled: true, url: "", icon: faTidal },
    { id: "soundcloud", name: "SoundCloud", enabled: true, url: "", icon: faSoundcloud },
    { id: "youtube", name: "YouTube", enabled: true, url: "", icon: faYoutube },
    { id: "itunes", name: "iTunes", enabled: true, url: "", icon: faApple },
  ]);

  const [additionalPlatforms, setAdditionalPlatforms] = useState<Platform[]>([
    { id: "anghami", name: "Anghami", enabled: false, url: "", icon: faMusic },
    { id: "napster", name: "Napster", enabled: false, url: "", icon: faMusic },
    { id: "boomplay", name: "Boomplay", enabled: false, url: "", icon: faMusic },
    { id: "yandex", name: "Yandex Music", enabled: false, url: "", icon: faMusic },
    { id: "beatport", name: "Beatport", enabled: false, url: "", icon: faMusic },
    { id: "bandcamp", name: "Bandcamp", enabled: false, url: "", icon: faMusic },
    { id: "audius", name: "Audius", enabled: false, url: "", icon: faMusic },
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
