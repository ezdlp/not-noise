
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
    // Generate slug based on content type
    if (isPlaylist) {
      if (title) {
        const generatedSlug = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        setSlug(generatedSlug);
      }
    } else {
      if (artistName && title) {
        const generatedSlug = `${artistName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        setSlug(generatedSlug);
      }
    }
  }, [artistName, title, isPlaylist]);

  const handleNext = async () => {
    if (!title.trim()) {
      toast.error(isPlaylist ? "Please enter a playlist name" : "Please enter a title");
      return;
    }

    if (!isPlaylist && !artistName.trim()) {
      toast.error("Please enter an artist name");
      return;
    }

    if (description && description.length > 120) {
      toast.error("Description must be 120 characters or less");
      return;
    }

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
      artist: isPlaylist ? undefined : artistName,
      slug: slug || undefined,
      description: description || undefined,
    });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {isPlaylist ? 'Playlist Details' : 'Release Details'}
        </h1>
        <p className="font-sans text-base text-[#374151]">
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
            className="w-40 h-40 sm:w-32 sm:h-32 rounded-lg object-cover shadow-sm border border-[#E6E6E6]"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              console.error("Failed to load artwork:", initialData.artworkUrl);
              img.src = "/placeholder.svg";
            }}
          />
        </div>
        <div className="flex-1 space-y-6">
          {!isPlaylist && (
            <div className="space-y-3">
              <Label className="font-sans font-medium">Artist Name</Label>
              <Input
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                placeholder="Enter artist name..."
                className="h-10 font-sans"
              />
            </div>
          )}

          <div className="space-y-3">
            <Label className="font-sans font-medium">
              {isPlaylist ? 'Playlist Name' : 'Release Title'}
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isPlaylist ? "Enter playlist name..." : "Enter release title..."}
              className="h-10 font-sans"
            />
          </div>

          <div className="space-y-3">
            <Label className="font-sans font-medium">Custom URL</Label>
            <div className="flex items-center space-x-2">
              <span className="font-sans text-sm text-[#6B7280] whitespace-nowrap bg-[#FAFAFA] px-3 py-2 rounded-md border border-[#E6E6E6]">
                soundraiser.io/link/
              </span>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="your-custom-url"
                className="flex-1 h-10 font-sans"
              />
            </div>
            <p className="font-sans text-sm text-[#6B7280]">
              Your {isPlaylist ? 'playlist' : 'track'} will be available at soundraiser.io/link/your-custom-url
            </p>
          </div>

          <div className="space-y-3">
            <Label className="font-sans font-medium">Description (Optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isPlaylist 
                ? "Add a short description about your playlist..."
                : "Add a short description about your release..."
              }
              className="resize-none font-sans min-h-[80px]"
              maxLength={120}
            />
            <p className="font-sans text-sm text-[#6B7280]">
              {description.length}/120 characters
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="bg-white text-[#0F0F0F] hover:bg-[#F3F3F3] active:bg-[#E6E6E6] h-10 px-4 shadow-sm border border-[#E6E6E6]"
        >
          Back
        </Button>
        <Button 
          onClick={handleNext}
          className="bg-[#6851FB] hover:bg-[#4A47A5] active:bg-[#271153] text-white h-10 px-4 font-sans font-medium"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default DetailsStep;
