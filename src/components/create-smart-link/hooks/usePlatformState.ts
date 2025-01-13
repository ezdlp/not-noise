import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Platform {
  id: string;
  name: string;
  enabled: boolean;
  url: string;
  icon: string;
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

export const usePlatformState = (initialSpotifyUrl: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [platforms, setPlatforms] = useState<Platform[]>([
    { id: "spotify", name: "Spotify", enabled: true, url: initialSpotifyUrl, icon: getPlatformIcon("spotify") },
    { id: "youtube_music", name: "YouTube Music", enabled: true, url: "", icon: getPlatformIcon("youtube_music") },
    { id: "youtube", name: "YouTube", enabled: true, url: "", icon: getPlatformIcon("youtube") },
    { id: "apple", name: "Apple Music", enabled: true, url: "", icon: getPlatformIcon("apple") },
    { id: "amazon", name: "Amazon Music", enabled: true, url: "", icon: getPlatformIcon("amazon") },
    { id: "deezer", name: "Deezer", enabled: true, url: "", icon: getPlatformIcon("deezer") },
    { id: "soundcloud", name: "SoundCloud", enabled: true, url: "", icon: getPlatformIcon("soundcloud") },
    { id: "itunes", name: "iTunes Store", enabled: true, url: "", icon: getPlatformIcon("itunes") },
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
    let progressInterval: NodeJS.Timeout;
    
    if (isLoading) {
      setProgress(0);
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);
    } else {
      setProgress(100);
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [isLoading]);

  const fetchOdesliLinks = async () => {
    if (!initialSpotifyUrl) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-odesli-links', {
        body: { url: initialSpotifyUrl }
      });

      if (error) {
        throw new Error(error.message);
      }

      setPlatforms(prev => prev.map(platform => {
        let url = "";
        switch (platform.id) {
          case "spotify":
            url = initialSpotifyUrl;
            break;
          case "apple":
            url = data.linksByPlatform.appleMusic?.url || "";
            break;
          case "youtube_music":
            url = data.linksByPlatform.youtubeMusic?.url || "";
            break;
          case "youtube":
            url = data.linksByPlatform.youtube?.url || "";
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

  return {
    isLoading,
    progress,
    platforms,
    additionalPlatforms,
    togglePlatform,
    updateUrl,
    fetchOdesliLinks,
  };
};