import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface PlatformsStepProps {
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

const PlatformsStep = ({ initialData, onNext, onBack }: PlatformsStepProps) => {
  const [platforms, setPlatforms] = useState([
    { id: "spotify", name: "Spotify", enabled: true, url: "" },
    { id: "apple", name: "Apple Music", enabled: false, url: "" },
    { id: "youtube", name: "YouTube Music", enabled: false, url: "" },
  ]);

  const handleNext = () => {
    onNext({
      ...initialData,
      platforms: platforms.filter((p) => p.enabled),
    });
  };

  const togglePlatform = (platformId: string) => {
    setPlatforms(
      platforms.map((p) =>
        p.id === platformId ? { ...p, enabled: !p.enabled } : p
      )
    );
  };

  const updateUrl = (platformId: string, url: string) => {
    setPlatforms(
      platforms.map((p) => (p.id === platformId ? { ...p, url } : p))
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Manage Platforms</h2>
        <p className="text-sm text-muted-foreground">
          Add your music links for each platform
        </p>
      </div>
      <div className="space-y-4">
        {platforms.map((platform) => (
          <div key={platform.id} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={platform.id}
                checked={platform.enabled}
                onCheckedChange={() => togglePlatform(platform.id)}
                disabled={platform.id === "spotify"}
              />
              <Label htmlFor={platform.id}>{platform.name}</Label>
            </div>
            {platform.enabled && (
              <Input
                placeholder={`Enter ${platform.name} URL...`}
                value={platform.url}
                onChange={(e) => updateUrl(platform.id, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
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