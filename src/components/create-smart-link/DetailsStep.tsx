import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface DetailsStepProps {
  initialData: {
    title: string;
    artistName: string;
    artworkUrl: string;
  };
  onNext: (data: any) => void;
  onBack: () => void;
}

const DetailsStep = ({ initialData, onNext, onBack }: DetailsStepProps) => {
  const [title, setTitle] = useState(initialData.title || "");
  const [artistName, setArtistName] = useState(initialData.artistName || "");
  const [slug, setSlug] = useState("");

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
      artistName,
      slug: slug || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Release Details</h2>
        <p className="text-sm text-muted-foreground">
          Enter the details for your release
        </p>
      </div>

      <div className="flex items-start gap-4">
        <img
          src={initialData.artworkUrl}
          alt="Release artwork"
          className="w-24 h-24 rounded-lg object-cover"
        />
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <Label>Artist Name</Label>
            <Input
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Enter artist name..."
            />
          </div>

          <div className="space-y-2">
            <Label>Release Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter release title..."
            />
          </div>

          <div className="space-y-2">
            <Label>Custom URL Slug (Optional)</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              placeholder="e.g., my-awesome-release"
            />
            <p className="text-sm text-muted-foreground">
              Leave empty to use auto-generated URL
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  );
};

export default DetailsStep;