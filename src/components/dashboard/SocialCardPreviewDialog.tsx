
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { Square, RectangleVertical } from "lucide-react";
import { toPng } from 'html-to-image';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SocialCardPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  smartLink: {
    title: string;
    artist_name: string;
    artwork_url: string;
    id: string;
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
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const getPreviewDimensions = () => {
    const maxWidth = Math.min(800, window.innerWidth * 0.9);
    const maxHeight = window.innerHeight * 0.8;
    
    const originalWidth = 1080;
    const originalHeight = format === "post" ? 1080 : 1920;
    
    const scale = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
    const width = Math.floor(originalWidth * scale);
    const height = Math.floor(originalHeight * scale);
    
    const artworkSize = format === "post" 
      ? Math.floor(width * 0.48) 
      : Math.floor(width * 0.60);
    
    const titleSize = Math.floor(artworkSize * (format === "post" ? 0.12 : 0.15));
    const artistNameSize = Math.floor(titleSize * 0.8);
    const platformIconSize = Math.floor(width * (format === "post" ? 0.06 : 0.08));
    const platformIconGap = Math.floor(width * (format === "post" ? 0.035 : 0.04));
    
    return {
      width,
      height,
      artworkSize,
      titleSize,
      artistNameSize,
      platformIconSize,
      platformIconGap,
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

    // Preload images
    const preloadImages = async () => {
      const imageUrls = [...icons.map(icon => icon.icon), smartLink.artwork_url];
      const loadPromises = imageUrls.map(url => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = url;
        });
      });
      await Promise.all(loadPromises);
      setImagesLoaded(true);
    };
    preloadImages();
  }, [smartLink.artwork_url]);

  const dimensions = getPreviewDimensions();

  const renderCard = (isExport: boolean = false) => {
    const width = isExport ? 1080 : dimensions.width;
    const height = isExport ? (format === "post" ? 1080 : 1920) : dimensions.height;
    const artworkSize = isExport 
      ? (format === "post" ? 518 : 648)
      : dimensions.artworkSize;
    const titleSize = isExport 
      ? (format === "post" ? 62 : 97)
      : dimensions.titleSize;
    const artistNameSize = isExport 
      ? (format === "post" ? 50 : 78)
      : dimensions.artistNameSize;
    const platformIconSize = isExport 
      ? (format === "post" ? 65 : 86)
      : dimensions.platformIconSize;
    const platformIconGap = isExport 
      ? (format === "post" ? 38 : 43)
      : dimensions.platformIconGap;

    return (
      <div 
        className="relative overflow-hidden"
        style={{ 
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: '#6851FB',
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
              background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.6) 100%)'
            }}
          />
        </div>

        {format === "post" ? (
          <div className="relative h-full flex flex-col items-center justify-between py-12">
            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
              <img 
                src={smartLink.artwork_url} 
                alt={smartLink.title}
                className="rounded-lg object-cover shadow-xl ring-1 ring-white/10"
                style={{
                  width: `${artworkSize}px`,
                  height: `${artworkSize}px`,
                }}
              />
              <div className="text-center space-y-4 px-8">
                <h1 
                  className="font-heading font-bold tracking-tight text-white"
                  style={{ fontSize: `${titleSize}px`, lineHeight: 1.1 }}
                >
                  {smartLink.title}
                </h1>
                <p 
                  className="text-white/90 font-medium"
                  style={{ fontSize: `${artistNameSize}px`, lineHeight: 1.2 }}
                >
                  {smartLink.artist_name}
                </p>
              </div>
            </div>
            <div className="text-center mt-auto">
              <p 
                className="text-white/70 uppercase tracking-widest font-medium mb-6"
                style={{ fontSize: `${isExport ? 13 : Math.max(10, width * 0.012)}px` }}
              >
                NOW AVAILABLE ON
              </p>
              <div 
                className="grid grid-flow-col auto-cols-max place-content-center"
                style={{ gap: `${platformIconGap}px` }}
              >
                {platformIcons.map((platform) => (
                  <img
                    key={platform.id}
                    src={platform.icon}
                    alt={platform.id}
                    className="opacity-90 filter brightness-0 invert"
                    style={{ 
                      width: `${platformIconSize}px`,
                      height: `${platformIconSize}px`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative h-full">
            <div 
              className="absolute top-0 left-0 right-0 flex flex-col items-center"
              style={{ marginTop: `${isExport ? 230 : height * 0.12}px` }}
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
                <h1 
                  className="font-heading font-bold tracking-tight text-white"
                  style={{ fontSize: `${titleSize}px`, lineHeight: 1.1 }}
                >
                  {smartLink.title}
                </h1>
                <p 
                  className="text-white/90 font-medium"
                  style={{ fontSize: `${artistNameSize}px`, lineHeight: 1.2 }}
                >
                  {smartLink.artist_name}
                </p>
              </div>
            </div>

            <div 
              className="absolute bottom-0 left-0 right-0 text-center"
              style={{ marginBottom: `${isExport ? 288 : height * 0.15}px` }}
            >
              <p 
                className="text-white/70 uppercase tracking-widest font-medium mb-6"
                style={{ fontSize: `${isExport ? 22 : Math.max(12, width * 0.02)}px` }}
              >
                NOW AVAILABLE ON
              </p>
              <div 
                className="grid grid-flow-col auto-cols-max place-content-center"
                style={{ gap: `${platformIconGap}px` }}
              >
                {platformIcons.map((platform) => (
                  <img
                    key={platform.id}
                    src={platform.icon}
                    alt={platform.id}
                    className="opacity-90 filter brightness-0 invert"
                    style={{ 
                      width: `${platformIconSize}px`,
                      height: `${platformIconSize}px`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleGenerate = async () => {
    if (!exportRef.current || !imagesLoaded) return;
    
    setIsLoading(true);
    const loadingToast = toast.loading("✨ We're doing some magic! Your asset will be ready in seconds...");

    try {
      const dataUrl = await toPng(exportRef.current, {
        quality: 1,
        width: 1080,
        height: format === "post" ? 1080 : 1920,
        backgroundColor: '#6851FB',
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();

      const filename = `${smartLink.id}-instagram-${format}-${Date.now()}.png`;
      const filePath = `${smartLink.id}/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from('social-media-assets')
        .upload(filePath, blob, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('social-media-assets')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('social_media_assets')
        .insert({
          smart_link_id: smartLink.id,
          platform: format === 'post' ? 'instagram_square' : 'instagram_story',
          image_url: publicUrl
        });

      if (dbError) throw dbError;

      toast.dismiss(loadingToast);
      toast.success("Asset generated successfully!");

      window.open(publicUrl, '_blank');
    } catch (error) {
      console.error('Error generating asset:', error);
      toast.dismiss(loadingToast);
      toast.error("Failed to generate social media asset");
    } finally {
      setIsLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-[90vw] w-auto rounded-xl">
        <DialogTitle className="sr-only">Social Card Preview</DialogTitle>
        <div 
          className="w-full bg-neutral-seasalt rounded-lg overflow-hidden flex items-center justify-center"
          style={{ 
            width: `${dimensions.width}px`, 
            height: `${dimensions.height}px`
          }}
        >
          <div ref={previewRef}>
            {renderCard(false)}
          </div>
        </div>

        <div 
          ref={exportRef} 
          className="fixed left-0 top-0 -z-50 opacity-0 pointer-events-none"
          style={{ 
            width: '1080px',
            height: format === "post" ? '1080px' : '1920px'
          }}
        >
          {renderCard(true)}
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
            onClick={handleGenerate}
            disabled={isLoading || !imagesLoaded}
            className="bg-primary hover:bg-primary-hover text-white"
          >
            {isLoading ? "Generating..." : "Generate Image"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
