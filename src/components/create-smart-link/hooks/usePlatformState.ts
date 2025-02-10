
import { useState } from "react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

export interface Platform {
  id: string;
  name: string;
  enabled: boolean;
  url: string;
  icon: string;
  isPremium?: boolean;
}

const getPlatformIcon = (platformId: string) => {
  const icons: { [key: string]: string } = {
    spotify: "/lovable-uploads/spotify.png",
    appleMusic: "/lovable-uploads/applemusic.png",
    amazonMusic: "/lovable-uploads/amazonmusic.png",
    youtubeMusic: "/lovable-uploads/youtubemusic.png",
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
  const { getAvailablePlatforms } = useFeatureAccess();
  const availablePlatforms = getAvailablePlatforms();

  const [platforms, setPlatforms] = useState<Platform[]>([
    { id: "spotify", name: "Spotify", enabled: true, url: initialSpotifyUrl, icon: getPlatformIcon("spotify") },
    { id: "youtubeMusic", name: "YouTube Music", enabled: false, url: "", icon: getPlatformIcon("youtubeMusic") },
    { id: "appleMusic", name: "Apple Music", enabled: false, url: "", icon: getPlatformIcon("appleMusic") },
    { id: "amazonMusic", name: "Amazon Music", enabled: false, url: "", icon: getPlatformIcon("amazonMusic") },
    { id: "deezer", name: "Deezer", enabled: false, url: "", icon: getPlatformIcon("deezer") },
  ]);

  const [additionalPlatforms, setAdditionalPlatforms] = useState<Platform[]>([
    { id: "tidal", name: "Tidal", enabled: false, url: "", icon: getPlatformIcon("tidal"), isPremium: true },
    { id: "anghami", name: "Anghami", enabled: false, url: "", icon: getPlatformIcon("anghami"), isPremium: true },
    { id: "napster", name: "Napster", enabled: false, url: "", icon: getPlatformIcon("napster"), isPremium: true },
    { id: "boomplay", name: "Boomplay", enabled: false, url: "", icon: getPlatformIcon("boomplay"), isPremium: true },
    { id: "yandex", name: "Yandex Music", enabled: false, url: "", icon: getPlatformIcon("yandex"), isPremium: true },
    { id: "beatport", name: "Beatport", enabled: false, url: "", icon: getPlatformIcon("beatport"), isPremium: true },
    { id: "bandcamp", name: "Bandcamp", enabled: false, url: "", icon: getPlatformIcon("bandcamp"), isPremium: true },
    { id: "audius", name: "Audius", enabled: false, url: "", icon: getPlatformIcon("audius"), isPremium: true },
  ]);

  const togglePlatform = (platformId: string) => {
    if (availablePlatforms && !availablePlatforms.includes(platformId)) {
      return; // Don't allow toggling premium platforms for free users
    }

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
    platforms,
    setPlatforms,
    additionalPlatforms,
    togglePlatform,
    updateUrl,
  };
};
