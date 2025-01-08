import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface DetailsStepProps {
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

const DetailsStep = ({ initialData, onNext, onBack }: DetailsStepProps) => {
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const handleNext = () => {
    onNext({
      ...initialData,
      slug,
      description,
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
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Custom URL Slug</label>
          <Input
            placeholder="e.g., my-awesome-track"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Description (Optional)</label>
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