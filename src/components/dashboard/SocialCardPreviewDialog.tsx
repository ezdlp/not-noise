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
  const [dominantColor, setDominantColor] = useState<string>("#6851FB");

  // Calculate dimensions based on viewport and format
  const getPreviewDimensions = () => {
    const maxWidth = Math.min(700, window.innerWidth * 0.9);
    const maxHeight = window.innerHeight * 0.8;
    
    // Original dimensions (Instagram standards)
    const originalWidth = 1080;
    const originalHeight = format === "post" ? 1080 : 1920;
    
    // Calculate scale based on container constraints
    const scaleX = maxWidth / originalWidth;
    const scaleY = maxHeight / originalHeight;
    const scale = Math.min(scaleX, scaleY);
    
    // Calculate final dimensions maintaining aspect ratio
    const width = Math.floor(originalWidth * scale);
    const height = Math.floor(originalHeight * scale);
    
    return {
      width,
      height,
      scale,
      // Story format: artwork takes 65% of width, Post format: 55% of width
      artworkSize: format === "post" 
        ? Math.floor(width * 0.55) 
        : Math.floor(width * 0.65)
    };
  };

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = smartLink.artwork_url;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let r = 0, g = 0, b = 0;

      // Sample pixels for average color
      for (let i = 0; i < imageData.length; i += 4) {
        r += imageData[i];
        g += imageData[i + 1];
        b += imageData[i + 2];
      }

      const pixelCount = imageData.length / 4;
      const avgColor = `rgb(${Math.floor(r/pixelCount)}, ${Math.floor(g/pixelCount)}, ${Math.floor(b/pixelCount)})`;
      setDominantColor(avgColor);
    };
  }, [smartLink.artwork_url]);

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

  const { width, height, artworkSize } = getPreviewDimensions();

  // Constants for Instagram story safe zones
  const STORY_TOP_SAFE_ZONE = 88;
  const STORY_BOTTOM_SAFE_ZONE = 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-[90vw] w-auto rounded-xl">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-6 top-6 p-2 hover:bg-neutral-seasalt rounded-full transition-colors z-10"
        >
          <X className="h-5 w-5 text-neutral-night" />
        </button>

        <div 
          className="w-full bg-neutral-night rounded-lg overflow-hidden"
          style={{ height: `${height}px`, width: `${width}px`, margin: '0 auto' }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <div 
              className="overflow-hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
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
                <div 
                  className="absolute inset-0" 
                  style={{
                    background: `linear-gradient(180deg, 
                      rgba(0,0,0,0.4) 0%, 
                      rgba(0,0,0,0.3) 50%, 
                      rgba(0,0,0,0.6) 100%
                    )`
                  }}
                />
              </div>

              {format === "post" ? (
                <div className="relative h-full flex flex-col items-center justify-between py-8">
                  <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                    <img 
                      src={smartLink.artwork_url} 
                      alt={smartLink.title}
                      className="rounded-lg object-cover shadow-xl ring-1 ring-white/10"
                      style={{
                        width: `${artworkSize}px`,
                        height: `${artworkSize}px`,
                      }}
                    />
                    <div className="text-center space-y-3 px-4">
                      <h1 className="font-heading font-bold tracking-tight text-white text-3xl md:text-4xl">
                        {smartLink.title}
                      </h1>
                      <p className="text-white/90 font-medium text-xl md:text-2xl">
                        {smartLink.artist_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-white/70 text-[10px] uppercase tracking-widest font-medium mb-4">
                      NOW AVAILABLE ON
                    </p>
                    <div className="grid grid-flow-col auto-cols-max gap-6 place-content-center">
                      {platformIcons.map((platform) => (
                        <img
                          key={platform.id}
                          src={platform.icon}
                          alt={platform.id}
                          className="w-5 h-5 opacity-90 filter brightness-0 invert"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative h-full flex flex-col items-center justify-between py-8">
                  {/* Story Format Layout */}
                  <div 
                    className="flex flex-col items-center"
                    style={{ marginTop: `${STORY_TOP_SAFE_ZONE}px` }}
                  >
                    <img 
                      src={smartLink.artwork_url} 
                      alt={smartLink.title}
                      className="rounded-lg object-cover shadow-xl ring-1 ring-white/10"
                      style={{
                        width: `${artworkSize}px`,
                        height: `${artworkSize}px`,
                      }}
                    />
                    <div className="text-center space-y-3 mt-8">
                      <h1 className="font-heading font-bold tracking-tight text-white" 
                          style={{ fontSize: `${Math.max(32, width * 0.08)}px` }}>
                        {smartLink.title}
                      </h1>
                      <p className="text-white/90 font-medium"
                         style={{ fontSize: `${Math.max(24, width * 0.06)}px` }}>
                        {smartLink.artist_name}
                      </p>
                    </div>
                  </div>

                  <div 
                    className="absolute bottom-0 left-0 right-0 text-center pb-8"
                    style={{ marginBottom: `${STORY_BOTTOM_SAFE_ZONE}px` }}
                  >
                    <p className="text-white/70 uppercase tracking-widest font-medium mb-6"
                       style={{ fontSize: `${Math.max(12, width * 0.02)}px` }}>
                      NOW AVAILABLE ON
                    </p>
                    <div className="grid grid-flow-col auto-cols-max gap-8 place-content-center">
                      {platformIcons.map((platform) => (
                        <img
                          key={platform.id}
                          src={platform.icon}
                          alt={platform.id}
                          className="opacity-90 filter brightness-0 invert"
                          style={{ 
                            width: `${Math.max(24, width * 0.035)}px`,
                            height: `${Math.max(24, width * 0.035)}px`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 flex justify-between items-center bg-white">
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