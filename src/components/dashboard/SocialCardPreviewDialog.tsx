import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Square, RectangleVertical, X } from "lucide-react";

interface SocialCardPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  smartLink: {
    title: string;
    artist_name: string;
    artwork_url: string;
  };
  onGenerate: () => void;
}

type Format = "post" | "story";

export function SocialCardPreviewDialog({
  open,
  onOpenChange,
  smartLink,
  onGenerate,
}: SocialCardPreviewDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [format, setFormat] = useState<Format>("post");
  const [platformIcons, setPlatformIcons] = useState<{ id: string; icon: string }[]>([]);

  // Fixed dimensions for the preview container
  const containerWidth = 700;
  const containerHeight = 580;
  const padding = 40;

  // Calculate dimensions that maintain aspect ratio and fit container
  const getPreviewDimensions = () => {
    const availableWidth = containerWidth - (padding * 2);
    const availableHeight = containerHeight - (padding * 2);
    
    // Original dimensions
    const originalWidth = 1080;
    const originalHeight = format === "post" ? 1080 : 1920;
    
    // Calculate scale based on container constraints
    const scaleX = availableWidth / originalWidth;
    const scaleY = availableHeight / originalHeight;
    const scale = Math.min(scaleX, scaleY);
    
    return {
      width: Math.floor(originalWidth * scale),
      height: Math.floor(originalHeight * scale),
      scale
    };
  };

  useEffect(() => {
    const icons = [
      { id: 'spotify', icon: '/lovable-uploads/spotify.png' },
      { id: 'appleMusic', icon: '/lovable-uploads/applemusic.png' },
      { id: 'youtubeMusic', icon: '/lovable-uploads/youtubemusic.png' },
      { id: 'amazonMusic', icon: '/lovable-uploads/amazonmusic.png' },
      { id: 'deezer', icon: '/lovable-uploads/deezer.png' },
    ];
    setPlatformIcons(icons);
  }, []);

  const { width, height } = getPreviewDimensions();
  const artworkSize = Math.floor(width * 0.55); // Reduced from 0.65 to 0.55 for better proportion

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="pt-6 px-6 pb-24 max-w-[700px] w-[700px] min-h-[700px] rounded-xl">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-6 top-6 p-2 hover:bg-neutral-seasalt rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-neutral-night" />
        </button>

        <div className="w-full h-[580px] bg-neutral-night rounded-lg overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center">
            <div 
              className="bg-primary overflow-hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ 
                width: `${width}px`,
                height: `${height}px`,
              }}
            >
              <div className="absolute inset-0 overflow-hidden">
                <div 
                  className="absolute inset-0 scale-110"
                  style={{ 
                    background: `url(${smartLink.artwork_url}) center center / cover`,
                    filter: 'blur(20px)',
                  }}
                />
                <div className="absolute inset-0 bg-black/40" /> {/* Increased opacity for better contrast */}
              </div>

              <div className="relative h-full flex flex-col items-center justify-between py-8"> {/* Increased padding */}
                <div className="flex-1 flex flex-col items-center justify-center space-y-8"> {/* Increased spacing */}
                  <img 
                    src={smartLink.artwork_url} 
                    alt={smartLink.title}
                    className="rounded-lg object-cover shadow-lg"
                    style={{
                      width: `${artworkSize}px`,
                      height: `${artworkSize}px`,
                    }}
                  />

                  <div className="text-center space-y-3"> {/* Adjusted spacing */}
                    <h1 className={`font-heading font-bold text-white ${format === 'story' ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'}`}>
                      {smartLink.title}
                    </h1>
                    <p className={`text-white/90 ${format === 'story' ? 'text-base md:text-lg' : 'text-lg md:text-xl'}`}>
                      {smartLink.artist_name}
                    </p>
                  </div>
                </div>

                <div className="text-center mt-6">
                  <p className="text-white/80 text-xs mb-4 tracking-wider font-medium">NOW AVAILABLE ON</p>
                  <div className="grid grid-flow-col auto-cols-max gap-6 place-content-center">
                    {platformIcons.map((platform) => (
                      <img
                        key={platform.id}
                        src={platform.icon}
                        alt={platform.id}
                        className="w-5 h-5 opacity-90" // Slightly reduced size and added opacity
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute left-6 right-6 bottom-6 flex justify-between items-center bg-white py-3">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-neutral-night">Format:</span>
            <div className="flex gap-2">
              <Button
                variant={format === "post" ? "secondary" : "outline"}
                onClick={() => setFormat("post")}
                className={`flex items-center gap-2 transition-all duration-200 ${
                  format === "post" 
                    ? "bg-primary-light text-primary hover:bg-primary-light/80" 
                    : "bg-neutral-seasalt border-neutral-border text-neutral-night hover:bg-neutral-seasalt/80"
                }`}
              >
                <Square className="h-4 w-4" />
                Post
              </Button>
              <Button
                variant={format === "story" ? "secondary" : "outline"}
                onClick={() => setFormat("story")}
                className={`flex items-center gap-2 transition-all duration-200 ${
                  format === "story" 
                    ? "bg-primary-light text-primary hover:bg-primary-light/80" 
                    : "bg-neutral-seasalt border-neutral-border text-neutral-night hover:bg-neutral-seasalt/80"
                }`}
              >
                <RectangleVertical className="h-4 w-4" />
                Story
              </Button>
            </div>
          </div>

          <Button 
            onClick={() => {
              setIsLoading(true);
              onGenerate();
              setIsLoading(false);
            }}
            disabled={isLoading}
            className="bg-primary hover:bg-primary-hover text-white"
          >
            {isLoading ? "Generating..." : "Generate Image"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}