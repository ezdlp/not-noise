import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { arrayMove } from '@dnd-kit/sortable';
import { PlatformsLoading } from "./PlatformsLoading";
import PlatformsSection from "./PlatformsSection";
import { usePlatformState } from "./hooks/usePlatformState";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PlatformsStepProps {
  initialData: {
    spotifyUrl: string;
    [key: string]: any;
  };
  onNext: (data: any) => void;
  onBack: () => void;
}

const PlatformsStep = ({ initialData, onNext, onBack }: PlatformsStepProps) => {
  const {
    isLoading,
    progress,
    platforms,
    setPlatforms,
    additionalPlatforms,
    togglePlatform,
    updateUrl,
  } = usePlatformState(initialData.spotifyUrl);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const { data: odesliData, error } = await supabase.functions.invoke('get-odesli-links', {
          body: { url: initialData.spotifyUrl }
        });

        if (error) throw error;

        if (!odesliData.linksByPlatform) {
          throw new Error("No links found for this track");
        }

        // Update platform URLs based on Odesli response
        setPlatforms(prevPlatforms => 
          prevPlatforms.map(platform => {
            let url = '';
            let enabled = platform.enabled;

            // Map platform IDs to Odesli platform keys
            const platformMapping: { [key: string]: string } = {
              spotify: 'spotify',
              youtube_music: 'youtubeMusic',
              youtube: 'youtube',
              apple: 'appleMusic',
              amazon: 'amazonMusic',
              deezer: 'deezer',
              soundcloud: 'soundcloud',
              itunes: 'itunes',
            };

            const odesliKey = platformMapping[platform.id];
            if (odesliKey && odesliData.linksByPlatform[odesliKey]) {
              url = odesliData.linksByPlatform[odesliKey].url;
              enabled = true;
            }

            return {
              ...platform,
              url,
              enabled: enabled
            };
          })
        );

        toast.success("Streaming links fetched successfully!");
      } catch (error) {
        console.error("Error fetching Odesli links:", error);
        toast.error("Failed to fetch streaming links. Please add them manually.");
      }
    };

    fetchLinks();
  }, [initialData.spotifyUrl, setPlatforms]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setPlatforms((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleNext = () => {
    const enabledPlatforms = platforms.filter((p) => p.enabled);
    if (!enabledPlatforms.some((p) => p.url)) {
      toast.error("Please add at least one platform URL");
      return;
    }
    
    onNext({
      ...initialData,
      platforms: [...enabledPlatforms],
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Manage Platforms</h2>
        <p className="text-sm text-muted-foreground">
          Drag to reorder platforms and enable the ones you want to include.
        </p>
      </div>

      {isLoading ? (
        <PlatformsLoading progress={progress} />
      ) : (
        <>
          <PlatformsSection
            title="Manage Platforms"
            platforms={platforms}
            onToggle={togglePlatform}
            onUrlChange={updateUrl}
            onDragEnd={handleDragEnd}
            isDraggable={true}
          />

          <PlatformsSection
            title="Additional Services"
            platforms={additionalPlatforms}
            onToggle={togglePlatform}
            onUrlChange={updateUrl}
          />
        </>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!platforms.some((p) => p.enabled && p.url)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default PlatformsStep;