
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DetailsStepProps {
  initialData: {
    title: string;
    artist: string;
    artworkUrl: string;
    spotifyUrl: string;
  };
  onNext: (data: any) => void;
  onBack: () => void;
}

const DetailsStep = ({ initialData, onNext, onBack }: DetailsStepProps) => {
  const [title, setTitle] = useState(initialData.title || "");
  const [artistName, setArtistName] = useState(initialData.artist || "");
  const [slug, setSlug] = useState("");

  useEffect(() => {
    // Generate slug from artist name and title
    if (artistName && title) {
      const generatedSlug = `${artistName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      setSlug(generatedSlug);
    }
  }, [artistName, title]);

  const handleNext = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!artistName.trim()) {
      toast.error("Please enter an artist name");
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
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg sm:text-xl font-semibold">Release Details</h2>
        <p className="text-sm text-muted-foreground">
          Enter the details for your release
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start gap-6">
        <div className="flex justify-center sm:block">
          <img
            src={initialData.artworkUrl || "/placeholder.svg"}
            alt="Release artwork"
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
            <Label className="text-sm font-medium">Release Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter release title..."
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Custom URL Slug</Label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">xnoi.se/</span>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="e.g., my-awesome-release"
                className="flex-1 h-10"
              />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Leave empty to use auto-generated URL
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
