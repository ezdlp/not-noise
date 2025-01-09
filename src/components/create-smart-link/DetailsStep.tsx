import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

interface DetailsStepProps {
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

const DetailsStep = ({ initialData, onNext, onBack }: DetailsStepProps) => {
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const generatedSlug = `${initialData.artist.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${initialData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    setSlug(generatedSlug);
  }, [initialData.artist, initialData.title]);

  const handleNext = () => {
    if (!slug.trim()) {
      toast.error("Please enter a URL slug");
      return;
    }
    
    onNext({
      ...initialData,
      slug,
      description,
    });
    toast.success("Details saved!", {
      position: "top-center",
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Edit Track Details</h2>
        <p className="text-sm text-muted-foreground">
          Customize your smart link details
        </p>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-4">
          <img 
            src={initialData.coverUrl} 
            alt={`${initialData.title} cover`} 
            className="w-24 h-24 object-cover rounded-lg"
          />
          <div>
            <h3 className="font-semibold text-lg">{initialData.title}</h3>
            <p className="text-muted-foreground">{initialData.artist}</p>
            <p className="text-sm text-muted-foreground mt-1">{initialData.album}</p>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Custom URL Slug</Label>
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground">srsr.li/</span>
            <Input
              placeholder="e.g., artist-track-name"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            This will be the URL of your smart link
          </p>
        </div>
        <div className="space-y-2">
          <Label>Description (Optional)</Label>
          <Textarea
            placeholder="Add a short description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={150}
          />
          <p className="text-xs text-muted-foreground">
            {description.length}/150 characters
          </p>
        </div>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={!slug.trim()}>
          Next
        </Button>
      </div>
    </div>
  );
};

export default DetailsStep;