import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface DetailsStepProps {
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

const DetailsStep = ({ initialData, onNext, onBack }: DetailsStepProps) => {
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

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
    toast.success("Details saved!");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Edit Track Details</h2>
        <p className="text-sm text-muted-foreground">
          Customize your smart link details
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Custom URL Slug</Label>
          <Input
            placeholder="e.g., my-awesome-track"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
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