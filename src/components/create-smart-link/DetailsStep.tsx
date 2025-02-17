
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DetailsStepProps {
  initialData: {
    title: string;
    artist: string;
    artworkUrl: string;
    spotifyUrl: string;
    description?: string;
    content_type?: 'track' | 'album' | 'playlist';
  };
  onNext: (data: any) => void;
  onBack: () => void;
}

const DetailsStep = ({ initialData, onNext, onBack }: DetailsStepProps) => {
  const [title, setTitle] = useState(initialData.title || "");
  const [artistName, setArtistName] = useState(initialData.artist || "");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState(initialData.description || "");
  const isPlaylist = initialData.content_type === 'playlist';

  useEffect(() => {
    // Generate slug from artist name and title
    if (artistName && title) {
      const generatedSlug = `${artistName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      setSlug(generatedSlug);
    }
  }, [artistName, title]);

  const handleNext = async () => {
    if (!title.trim()) {
      toast.error(`Please enter a ${isPlaylist ? 'playlist name' : 'title'}`);
      return;
    }

    if (!artistName.trim()) {
      toast.error("Please enter an artist name");
      return;
    }

    if (description && description.length > 120) {
      toast.error("Description must be 120 characters or less");
      return;
    }

    // Check if slug exists
    if (slug) {
      const { data: existingSlug } = await supabase
        .from("smart_links")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (existingSlug) {
        toast.error("This URL slug is already taken. Please choose another one.");
        return;
      }
    }

    onNext({
      ...initialData,
      title,
      artist: artistName,
      slug: slug || undefined,
      description: description || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg sm:text-xl font-semibold">
          {isPlaylist ? 'Playlist Details' : 'Release Details'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isPlaylist 
            ? 'Enter the details for your playlist'
            : 'Enter the details for your release'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start gap-6">
        <div className="flex justify-center sm:block">
          <img
            src={initialData.artworkUrl || "/placeholder.svg"}
            alt={isPlaylist ? "Playlist artwork" : "Release artwork"}
            className="w-40 h-40 sm:w-32 sm:h-32 rounded-lg object-cover"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              console.error("Failed to load artwork:", initialData.artworkUrl);
              img.src = "/placeholder.svg";
            }}
          />
        </div>
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Artist Name</Label>
            <Input
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Enter artist name..."
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {isPlaylist ? 'Playlist Name' : 'Release Title'}
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isPlaylist ? "Enter playlist name..." : "Enter release title..."}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Custom URL</Label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap bg-neutral-50 px-2 py-1.5 rounded-md border">
                soundraiser.io/link/
              </span>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="your-custom-url"
                className="flex-1 h-10"
              />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Your {isPlaylist ? 'playlist' : 'track'} will be available at soundraiser.io/link/your-custom-url
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Description (Optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isPlaylist 
                ? "Add a short description about your playlist..."
                : "Add a short description about your release..."
              }
              className="resize-none"
              maxLength={120}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/120 characters
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  );
};

export default DetailsStep;
