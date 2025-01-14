import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { useEffect, useState } from "react";

interface Platform {
  id: string;
  name: string;
  enabled: boolean;
  url: string;
  icon: string;
}

interface PlatformItemProps {
  platform: Platform;
  onToggle: (id: string) => void;
  onUrlChange: (id: string, url: string) => void;
  isDraggable?: boolean;
}

const PlatformItem = ({ 
  platform, 
  onToggle, 
  onUrlChange, 
  isDraggable = true,
}: PlatformItemProps) => {
  const [iconUrl, setIconUrl] = useState(platform.icon);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: platform.id });

  useEffect(() => {
    setIconUrl(platform.icon);
  }, [platform.icon]);

  const handleImageError = () => {
    const iconMap: { [key: string]: string } = {
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

    const fallbackIcon = iconMap[platform.id] || "/placeholder.svg";
    if (iconUrl !== fallbackIcon) {
      console.error("Failed to load platform icon:", platform.icon);
      setIconUrl(fallbackIcon);
    }
  };

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    transition,
  } : undefined;

  return (
    <div 
      ref={isDraggable ? setNodeRef : undefined} 
      style={style} 
      className="bg-white p-4 rounded-lg shadow-sm mb-2 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center gap-4">
        {isDraggable && (
          <div {...attributes} {...listeners} className="cursor-grab hover:opacity-70">
            <GripVertical className="text-gray-400" />
          </div>
        )}
        <div className="flex items-center gap-3 flex-1">
          <img 
            src={iconUrl}
            alt={`${platform.name} logo`}
            className="w-8 h-8 object-contain"
            onError={handleImageError}
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

export default PlatformItem;