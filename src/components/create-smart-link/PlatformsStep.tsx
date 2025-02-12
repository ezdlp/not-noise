
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { arrayMove } from '@dnd-kit/sortable';
import { PlatformsLoading } from "./PlatformsLoading";
import PlatformsSection from "./PlatformsSection";
import { usePlatformState } from "./hooks/usePlatformState";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradeModal } from "../subscription/UpgradeModal";

interface PlatformsStepProps {
  initialData: {
    spotifyUrl: string;
    [key: string]: any;
  };
  onNext: (data: any) => void;
  onBack: () => void;
}

const PlatformsStep = ({ initialData, onNext, onBack }: PlatformsStepProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { isFeatureEnabled } = useFeatureAccess();
  const canReorderPlatforms = isFeatureEnabled('platform_reordering');

  const {
    platforms,
    setPlatforms,
    additionalPlatforms,
    togglePlatform,
    updateUrl,
    isPro,
  } = usePlatformState(initialData.spotifyUrl);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    
    const fetchLinks = async () => {
      try {
        progressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 10, 90));
        }, 500);

        const { data: odesliData, error } = await supabase.functions.invoke('get-odesli-links', {
          body: { url: initialData.spotifyUrl }
        });

        if (error) throw error;

        if (!odesliData.linksByPlatform) {
          throw new Error("No links found for this track");
        }

        console.log("Received platform links:", odesliData.linksByPlatform);

        setPlatforms(prevPlatforms => 
          prevPlatforms.map(platform => {
            const url = odesliData.linksByPlatform[platform.id]?.url || "";
            console.log(`Mapping platform ${platform.id}:`, url);
            return {
              ...platform,
              url,
              enabled: platform.id === "spotify" ? true : !!url
            };
          })
        );

        setProgress(100);
        toast.success("Streaming links fetched successfully!");
      } catch (error) {
        console.error("Error fetching Odesli links:", error);
        toast.error("Failed to fetch streaming links. Please add them manually.");
      } finally {
        clearInterval(progressInterval);
        setIsLoading(false);
      }
    };

    fetchLinks();

    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [initialData.spotifyUrl, setPlatforms]);

  const handleDragEnd = (event: any) => {
    if (!canReorderPlatforms) {
      setShowUpgradeModal(true);
      return;
    }

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
          {canReorderPlatforms 
            ? "Drag to reorder platforms and enable the ones you want to include."
            : "Enable the platforms you want to include in your smart link."}
        </p>
      </div>

      {isLoading ? (
        <PlatformsLoading progress={progress} />
      ) : (
        <>
          <PlatformsSection
            title="Standard Platforms"
            platforms={platforms}
            onToggle={togglePlatform}
            onUrlChange={updateUrl}
            onDragEnd={handleDragEnd}
            isDraggable={canReorderPlatforms}
          />

          <PlatformsSection
            title="Additional Platforms"
            description={!isPro ? "Upgrade to Pro to access these platforms" : undefined}
            platforms={additionalPlatforms}
            onToggle={isPro ? togglePlatform : () => setShowUpgradeModal(true)}
            onUrlChange={updateUrl}
            isDraggable={false}
            isBlurred={!isPro}
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

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="access all music platforms"
        description="Upgrade to Pro to add more music platforms and customize their order!"
      />
    </div>
  );
};

export default PlatformsStep;
