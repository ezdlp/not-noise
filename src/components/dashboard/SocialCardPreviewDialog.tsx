import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

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

export function SocialCardPreviewDialog({
  open,
  onOpenChange,
  smartLink,
  onGenerate,
}: SocialCardPreviewDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
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
      <DialogContent className="max-w-[650px] p-0 overflow-hidden">
        <div className="relative w-[1080px] h-[1080px] mx-auto overflow-hidden"
          style={{ 
            transform: 'scale(0.45)',
            transformOrigin: 'top center',
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
          <div 
            className="absolute inset-0"
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
            }}
          />

          <div className="relative w-full h-full flex flex-col items-center justify-center p-10 gap-10">
            <img 
              src={smartLink.artwork_url} 
              alt={smartLink.title}
              className="w-[500px] h-[500px] rounded-lg object-cover shadow-2xl"
            />
            <div className="text-center">
              <h1 className="text-5xl font-bold text-white mb-4">{smartLink.title}</h1>
              <p className="text-3xl text-white/90">{smartLink.artist_name}</p>
            </div>

            {/* Platform logos section */}
            <div className="mt-auto text-center">
              <p className="text-white text-xl mb-6">NOW AVAILABLE ON</p>
              <div className="flex justify-center items-center gap-8">
                {platformIcons.map((platform) => (
                  <img
                    key={platform.id}
                    src={platform.icon}
                    alt={platform.id}
                    className="w-12 h-12 object-contain"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-4 right-4">
          <Button 
            onClick={() => {
              setIsLoading(true);
              onGenerate();
              setIsLoading(false);
            }}
            disabled={isLoading}
          >
            {isLoading ? "Generating..." : "Generate Image"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}