
import React from "react";
import PlatformButton from "./PlatformButton";

interface PlatformButtonListProps {
  platformLinks: Array<{
    id: string;
    platform_id: string;
    platform_name: string;
    url: string;
  }>;
  onPlatformClick: (platformLinkId: string) => Promise<void>;
}

const PlatformButtonList = ({ platformLinks, onPlatformClick }: PlatformButtonListProps) => {
  const platformIcons: { [key: string]: string } = {
    spotify: "/lovable-uploads/spotify.png",
    apple_music: "/lovable-uploads/applemusic.png",
    youtube_music: "/lovable-uploads/youtubemusic.png",
    youtube: "/lovable-uploads/youtube.png",
    amazon_music: "/lovable-uploads/amazonmusic.png",
    deezer: "/lovable-uploads/deezer.png",
    soundcloud: "/lovable-uploads/soundcloud.png",
    itunes: "/lovable-uploads/itunes.png",
    tidal: "/lovable-uploads/tidal.png",
    anghami: "/lovable-uploads/anghami.png",
    napster: "/lovable-uploads/napster.png",
    boomplay: "/lovable-uploads/boomplay.png",
    yandex: "/lovable-uploads/yandex.png",
    beatport: "/lovable-uploads/beatport.png",
    bandcamp: "/lovable-uploads/bandcamp.png",
    audius: "/lovable-uploads/audius.png",
    youtubeMusic: "/lovable-uploads/youtubemusic.png",
    appleMusic: "/lovable-uploads/applemusic.png",
    amazonMusic: "/lovable-uploads/amazonmusic.png",
  };

  const getActionText = (platformId: string): string => {
    return ['itunes', 'beatport'].includes(platformId) ? 'Buy' : 'Play';
  };

  return (
    <div className="space-y-4">
      {platformLinks?.map((platformLink) => {
        const icon = platformIcons[platformLink.platform_id];
        if (!icon) {
          console.warn(`No icon found for platform: ${platformLink.platform_id}`);
          return null;
        }

        return (
          <PlatformButton
            key={platformLink.id}
            name={platformLink.platform_name}
            icon={icon}
            action={getActionText(platformLink.platform_id)}
            url={platformLink.url}
            onClick={() => onPlatformClick(platformLink.id)}
          />
        );
      })}
    </div>
  );
};

export default PlatformButtonList;
