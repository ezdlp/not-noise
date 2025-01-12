import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface DetailsStepProps {
  initialData: {
    title: string;
    slug: string;
    [key: string]: any;
  };
  onNext: (data: any) => void;
  onBack: () => void;
}

const DetailsStep = ({ initialData, onNext, onBack }: DetailsStepProps) => {
  const [title, setTitle] = useState(initialData.title);
  const [slug, setSlug] = useState(initialData.slug || "");

  const handleNext = () => {
    if (!title || !slug) {
      toast.error("Please fill in all fields.");
      return;
    }
    onNext({ title, slug });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Customize Your Smart Link</h2>
        <p className="text-sm text-muted-foreground">
          Add a custom URL and release date for your smart link
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Custom URL</Label>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">xnoi.se/</span>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="custom-url-slug"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your smart link title"
          />
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
