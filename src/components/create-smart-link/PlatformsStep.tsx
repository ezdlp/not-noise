import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { arrayMove } from '@dnd-kit/sortable';
import { PlatformsLoading } from "./PlatformsLoading";
import PlatformsSection from "./PlatformsSection";
import { usePlatformState } from "./hooks/usePlatformState";

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
    additionalPlatforms,
    togglePlatform,
    updateUrl,
    fetchOdesliLinks,
  } = usePlatformState(initialData.spotifyUrl);

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
      platforms: enabledPlatforms,
    });
    toast.success("Platforms saved!");
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