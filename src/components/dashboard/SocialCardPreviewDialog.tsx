import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { X, Square, RectangleVertical } from "lucide-react";

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

  useEffect(() => {
    // Load platform icons
    const icons = [
      { id: 'spotify', icon: '/lovable-uploads/spotify.png' },
      { id: 'appleMusic', icon: '/lovable-uploads/applemusic.png' },
      { id: 'youtubeMusic', icon: '/lovable-uploads/youtubemusic.png' },
      { id: 'amazonMusic', icon: '/lovable-uploads/amazonmusic.png' },
      { id: 'deezer', icon: '/lovable-uploads/deezer.png' },
    ];
    setPlatformIcons(icons);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-6 overflow-hidden max-w-[700px] w-[700px] rounded-xl">
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-6 top-6 p-2 hover:bg-neutral-seasalt rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-neutral-night" />
        </button>

        {/* Preview container */}
        <div 
          className="relative w-full bg-neutral-night rounded-lg overflow-hidden transition-all duration-300 ease-out" 
          style={{ 
            aspectRatio: format === "post" ? "1/1" : "9/16",
            maxHeight: format === "post" ? "600px" : "800px"
          }}
        >
          {/* Container for the preview */}
          <div 
            className="absolute inset-0"
            style={{ 
              transform: format === "post" ? 'scale(0.555)' : 'scale(0.416)',
              transformOrigin: 'top left',
            }}
          >
            <div 
              className="relative" 
              style={{ 
                width: format === "post" ? "1080px" : "1080px",
                height: format === "post" ? "1080px" : "1920px"
              }}
            >
              {/* Background with blur */}
              <div 
                className="absolute inset-0"
                style={{ 
                  background: `url(${smartLink.artwork_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(20px)',
                }}
              />
              <div className="absolute inset-0 bg-black/30" />

              {/* Content */}
              <div 
                className="relative w-full h-full flex flex-col items-center justify-center p-10 gap-10"
                style={{
                  paddingTop: format === "story" ? "250px" : "34px",
                  paddingBottom: format === "story" ? "150px" : "34px",
                }}
              >
                <img 
                  src={smartLink.artwork_url} 
                  alt={smartLink.title}
                  className={`rounded-lg object-cover shadow-lg ${
                    format === "post" ? "w-[500px] h-[500px]" : "w-[800px] h-[800px]"
                  }`}
                />
                <div className="text-center">
                  <h1 className={`font-heading font-bold text-white mb-4 ${
                    format === "post" ? "text-5xl" : "text-6xl"
                  }`}>{smartLink.title}</h1>
                  <p className={`text-white/90 ${
                    format === "post" ? "text-3xl" : "text-4xl"
                  }`}>{smartLink.artist_name}</p>
                </div>

                {/* Platform logos section */}
                <div className="mt-auto text-center">
                  <p className={`text-white mb-6 ${
                    format === "post" ? "text-xl" : "text-2xl"
                  }`}>NOW AVAILABLE ON</p>
                  <div className="flex justify-center items-center gap-8">
                    {platformIcons.map((platform) => (
                      <img
                        key={platform.id}
                        src={platform.icon}
                        alt={platform.id}
                        className={format === "post" ? "w-12 h-12" : "w-16 h-16"}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="absolute left-6 right-6 bottom-6 flex justify-between items-center">
          {/* Format switcher */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-neutral-night">Format:</span>
            <div className="flex gap-2">
              <Button
                variant={format === "post" ? "secondary" : "outline"}
                onClick={() => setFormat("post")}
                className={`flex items-center gap-2 transition-colors ${
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
                className={`flex items-center gap-2 transition-colors ${
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

          {/* Generate button */}
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