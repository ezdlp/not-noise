import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { arrayMove } from '@dnd-kit/sortable';
import PlatformsSection from "./PlatformsSection";

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
    spotify: "/lovable-uploads/spotify.png",
    apple: "/lovable-uploads/applemusic.png",
    amazon: "/lovable-uploads/amazonmusic.png",
    youtube_music: "/lovable-uploads/youtubemusic.png",
    deezer: "/lovable-uploads/deezer.png",
    soundcloud: "/lovable-uploads/soundcloud.png",
    youtube: "/lovable-uploads/youtube.png",
    itunes: "/lovable-uploads/itunes.png",
    tidal: "/lovable-uploads/tidal.png",
    anghami: "/lovable-uploads/anghami.png",
    napster: "/lovable-uploads/napster.png",
    boomplay: "/lovable-uploads/boomplay.png",
    yandex: "/lovable-uploads/yandex.png",
    beatport: "/lovable-uploads/beatport.png",
    bandcamp: "/lovable-uploads/bandcamp.png",
    audius: "/lovable-uploads/audius.png",
  };
  return icons[platformId] || "/placeholder.svg";
};

const PlatformsStep = ({ initialData, onNext, onBack }: PlatformsStepProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [platforms, setPlatforms] = useState<Platform[]>([
    { id: "spotify", name: "Spotify", enabled: true, url: initialData.spotifyUrl, icon: getPlatformIcon("spotify") },
    { id: "apple", name: "Apple Music", enabled: true, url: "", icon: getPlatformIcon("apple") },
    { id: "amazon", name: "Amazon Music", enabled: true, url: "", icon: getPlatformIcon("amazon") },
    { id: "youtube_music", name: "YouTube Music", enabled: true, url: "", icon: getPlatformIcon("youtube_music") },
    { id: "deezer", name: "Deezer", enabled: true, url: "", icon: getPlatformIcon("deezer") },
    { id: "soundcloud", name: "SoundCloud", enabled: true, url: "", icon: getPlatformIcon("soundcloud") },
    { id: "youtube", name: "YouTube", enabled: true, url: "", icon: getPlatformIcon("youtube") },
    { id: "itunes", name: "iTunes", enabled: true, url: "", icon: getPlatformIcon("itunes") },
  ]);

  const [additionalPlatforms, setAdditionalPlatforms] = useState<Platform[]>([
    { id: "tidal", name: "Tidal", enabled: false, url: "", icon: getPlatformIcon("tidal") },
    { id: "anghami", name: "Anghami", enabled: false, url: "", icon: getPlatformIcon("anghami") },
    { id: "napster", name: "Napster", enabled: false, url: "", icon: getPlatformIcon("napster") },
    { id: "boomplay", name: "Boomplay", enabled: false, url: "", icon: getPlatformIcon("boomplay") },
    { id: "yandex", name: "Yandex Music", enabled: false, url: "", icon: getPlatformIcon("yandex") },
    { id: "beatport", name: "Beatport", enabled: false, url: "", icon: getPlatformIcon("beatport") },
    { id: "bandcamp", name: "Bandcamp", enabled: false, url: "", icon: getPlatformIcon("bandcamp") },
    { id: "audius", name: "Audius", enabled: false, url: "", icon: getPlatformIcon("audius") },
  ]);

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
    const additionalPlatform = additionalPlatforms.find(p => p.id === platformId);
    if (additionalPlatform) {
      if (!additionalPlatform.enabled) {
        setPlatforms(prev => [...prev, { ...additionalPlatform, enabled: true }]);
        setAdditionalPlatforms(prev => prev.filter(p => p.id !== platformId));
      }
    } else {
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

      <PlatformsSection
        title="Manage Platforms"
        platforms={platforms}
        onToggle={togglePlatform}
        onUrlChange={updateUrl}
        onDragEnd={handleDragEnd}
        isDraggable={true}
      />

      <PlatformsSection
        title="Additional Services"
        platforms={additionalPlatforms}
        onToggle={togglePlatform}
        onUrlChange={updateUrl}
      />

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