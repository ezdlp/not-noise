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
      <DialogContent className="p-12 overflow-hidden max-w-[700px] w-[700px] rounded-xl">
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-8 top-8 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Format switcher */}
        <div className="absolute left-12 bottom-8 flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Format:</span>
          <div className="flex gap-2">
            <Button
              variant={format === "post" ? "default" : "outline"}
              onClick={() => setFormat("post")}
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Post
            </Button>
            <Button
              variant={format === "story" ? "default" : "outline"}
              onClick={() => setFormat("story")}
              className="flex items-center gap-2"
            >
              <RectangleVertical className="h-4 w-4" />
              Story
            </Button>
          </div>
        </div>

        {/* Preview container */}
        <div className="relative w-full bg-black rounded-none overflow-hidden" 
             style={{ 
               aspectRatio: format === "post" ? "1/1" : "9/16",
               maxHeight: format === "post" ? "600px" : "800px"
             }}>
          {/* Container for the preview */}
          <div 
            className="absolute inset-0"
            style={{ 
              transform: format === "post" ? 'scale(0.555)' : 'scale(0.416)', // 600/1080 or 800/1920
              transformOrigin: 'top left',
            }}
          >
            <div className="relative" 
                 style={{ 
                   width: format === "post" ? "1080px" : "1080px",
                   height: format === "post" ? "1080px" : "1920px"
                 }}>
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

              {/* Content */}
              <div className="relative w-full h-full flex flex-col items-center justify-center p-10 gap-10"
                   style={{
                     paddingTop: format === "story" ? "250px" : "34px",
                     paddingBottom: format === "story" ? "150px" : "34px",
                   }}>
                <img 
                  src={smartLink.artwork_url} 
                  alt={smartLink.title}
                  className={`rounded-lg object-cover shadow-2xl ${
                    format === "post" ? "w-[500px] h-[500px]" : "w-[800px] h-[800px]"
                  }`}
                />
                <div className="text-center">
                  <h1 className={`font-bold text-white mb-4 ${
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

        {/* Generate button */}
        <div className="absolute bottom-8 right-12">
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