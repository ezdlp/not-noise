import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Image, ImagePlus, X } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { MediaLibrary } from "./MediaLibrary";
import { cn } from "@/lib/utils";

interface FeaturedImageProps {
  value?: string;
  onChange: (url: string | undefined) => void;
}

export function FeaturedImage({ value, onChange }: FeaturedImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (url: string) => {
    onChange(url);
    setIsOpen(false);
  };

  const handleRemove = () => {
    onChange(undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Featured Image</h4>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              {value ? <Image className="h-4 w-4 mr-2" /> : <ImagePlus className="h-4 w-4 mr-2" />}
              {value ? "Change Image" : "Add Image"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <MediaLibrary onSelect={handleSelect} onClose={() => setIsOpen(false)} showInsertButton />
          </DialogContent>
        </Dialog>
      </div>

      {value && (
        <div className="relative">
          <img
            src={value}
            alt="Featured"
            className={cn(
              "rounded-md border bg-muted",
              "w-full h-[200px] object-cover"
            )}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}