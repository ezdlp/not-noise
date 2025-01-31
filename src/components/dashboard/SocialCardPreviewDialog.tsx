import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Social Media Card Preview</DialogTitle>
        </DialogHeader>
        <div className="p-6">
          <div 
            className="w-[1080px] h-[1080px] bg-primary mx-auto overflow-hidden"
            style={{ transform: 'scale(0.8)', transformOrigin: 'top center' }}
          >
            <div className="w-full h-full flex flex-col items-center justify-center p-10 gap-10">
              <img 
                src={smartLink.artwork_url} 
                alt={smartLink.title}
                className="w-[500px] h-[500px] rounded-lg object-cover shadow-2xl"
              />
              <div className="text-center">
                <h1 className="text-5xl font-bold text-white mb-4">{smartLink.title}</h1>
                <p className="text-3xl text-white/90">{smartLink.artist_name}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-6">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}