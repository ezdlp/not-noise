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
    slug?: string;
    [key: string]: any;
  };
  onNext: (data: any) => void;
  onBack: () => void;
}

const DetailsStep = ({ initialData, onNext, onBack }: DetailsStepProps) => {
  const [title, setTitle] = useState(initialData.title);
  const [slug, setSlug] = useState(initialData.slug || "");
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);

  const generateSlug = (title: string, artist: string) => {
    const baseSlug = `${artist}-${title}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return baseSlug;
  };

  const checkSlugAvailability = async (proposedSlug: string) => {
    setIsCheckingSlug(true);
    try {
      const { data } = await supabase
        .from("smart_links")
        .select("id")
        .eq("slug", proposedSlug)
        .maybeSingle();

      if (data) {
        // Slug exists, try with a numeric suffix
        let counter = 1;
        let newSlug = `${proposedSlug}-${counter}`;
        
        while (true) {
          const { data: existingSlug } = await supabase
            .from("smart_links")
            .select("id")
            .eq("slug", newSlug)
            .maybeSingle();
          
          if (!existingSlug) {
            return newSlug;
          }
          counter++;
          newSlug = `${proposedSlug}-${counter}`;
        }
      }
      
      return proposedSlug;
    } catch (error) {
      console.error("Error checking slug availability:", error);
      return proposedSlug;
    } finally {
      setIsCheckingSlug(false);
    }
  };

  useEffect(() => {
    const initializeSlug = async () => {
      if (!slug && title && initialData.artist) {
        const baseSlug = generateSlug(title, initialData.artist);
        const availableSlug = await checkSlugAvailability(baseSlug);
        setSlug(availableSlug);
      }
    };

    initializeSlug();
  }, [title, initialData.artist, slug]);

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
              disabled={isCheckingSlug}
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
        <Button onClick={handleNext} disabled={isCheckingSlug}>Next</Button>
      </div>
    </div>
  );
};

export default DetailsStep;