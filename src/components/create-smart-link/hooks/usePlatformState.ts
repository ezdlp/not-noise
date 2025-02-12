
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

const standardPlatforms: Platform[] = [
  { id: "spotify", name: "Spotify", enabled: false, url: "", icon: getPlatformIcon("spotify") },
  { id: "appleMusic", name: "Apple Music", enabled: false, url: "", icon: getPlatformIcon("appleMusic") },
  { id: "youtubeMusic", name: "YouTube Music", enabled: false, url: "", icon: getPlatformIcon("youtubeMusic") },
  { id: "amazonMusic", name: "Amazon Music", enabled: false, url: "", icon: getPlatformIcon("amazonMusic") },
  { id: "deezer", name: "Deezer", enabled: false, url: "", icon: getPlatformIcon("deezer") },
  { id: "soundcloud", name: "SoundCloud", enabled: false, url: "", icon: getPlatformIcon("soundcloud") },
  { id: "youtube", name: "YouTube", enabled: false, url: "", icon: getPlatformIcon("youtube") },
  { id: "itunes", name: "iTunes Store", enabled: false, url: "", icon: getPlatformIcon("itunes") },
  { id: "tidal", name: "Tidal", enabled: false, url: "", icon: getPlatformIcon("tidal"), isPremium: true },
];

const additionalPlatforms: Platform[] = [
  { id: "beatport", name: "Beatport", enabled: false, url: "", icon: getPlatformIcon("beatport"), isPremium: true },
  { id: "bandcamp", name: "Bandcamp", enabled: false, url: "", icon: getPlatformIcon("bandcamp"), isPremium: true },
  { id: "napster", name: "Napster", enabled: false, url: "", icon: getPlatformIcon("napster"), isPremium: true },
  { id: "anghami", name: "Anghami", enabled: false, url: "", icon: getPlatformIcon("anghami"), isPremium: true },
  { id: "boomplay", name: "Boomplay", enabled: false, url: "", icon: getPlatformIcon("boomplay"), isPremium: true },
  { id: "yandex", name: "Yandex Music", enabled: false, url: "", icon: getPlatformIcon("yandex"), isPremium: true },
  { id: "audius", name: "Audius", enabled: false, url: "", icon: getPlatformIcon("audius"), isPremium: true },
];

export const usePlatformState = (initialSpotifyUrl: string) => {
  const { getAvailablePlatforms } = useFeatureAccess();
  const availablePlatforms = getAvailablePlatforms();
  const isPro = availablePlatforms === null;

  // Initialize platforms based on user type
  const [platforms, setPlatforms] = useState<Platform[]>(() => {
    const initialPlatforms = isPro 
      ? [...standardPlatforms] 
      : standardPlatforms.slice(0, 7); // Exclude Tidal for free users
    
    // Set initial Spotify URL
    const spotifyPlatform = initialPlatforms.find(p => p.id === "spotify");
    if (spotifyPlatform) {
      spotifyPlatform.enabled = true;
      spotifyPlatform.url = initialSpotifyUrl;
    }
    return initialPlatforms;
  });

  // Only used for free users or additional platforms for pro users
  const [additionalPlatformsState, setAdditionalPlatformsState] = useState<Platform[]>(() => 
    [...additionalPlatforms]
  );

  const togglePlatform = (platformId: string) => {
    // For platforms in the standard section
    const platformIndex = platforms.findIndex(p => p.id === platformId);
    if (platformIndex !== -1) {
      setPlatforms(prev => prev.map((p, index) => 
        index === platformIndex ? { ...p, enabled: !p.enabled } : p
      ));
      return;
    }

    // For additional platforms (Pro users only)
    if (isPro) {
      const additionalPlatform = additionalPlatformsState.find(p => p.id === platformId);
      if (additionalPlatform) {
        // Move to standard platforms when enabled
        setPlatforms(prev => [...prev, { ...additionalPlatform, enabled: true }]);
        setAdditionalPlatformsState(prev => prev.filter(p => p.id !== platformId));
      }
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
    additionalPlatforms: additionalPlatformsState,
    togglePlatform,
    updateUrl,
    isPro,
  };
};
