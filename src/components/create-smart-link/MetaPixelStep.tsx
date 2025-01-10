import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface MetaPixelStepProps {
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

const MetaPixelStep = ({ initialData, onNext, onBack }: MetaPixelStepProps) => {
  const [enabled, setEnabled] = useState(false);
  const [pixelId, setPixelId] = useState("");
  const [viewEventName, setViewEventName] = useState("SmartLinkView");
  const [clickEventName, setClickEventName] = useState("SmartLinkClick");

  const handleNext = () => {
    if (enabled && !pixelId.trim()) {
      toast.error("Please enter a Meta Pixel ID");
      return;
    }

    onNext({
      ...initialData,
      metaPixel: {
        enabled,
        pixelId: pixelId.trim(),
        viewEventName,
        clickEventName,
      },
    });
    toast.success("Meta Pixel settings saved!");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Meta Pixel Configuration</h2>
        <p className="text-sm text-muted-foreground">
          Track conversions and build audiences for your smart link
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meta Pixel Integration</CardTitle>
          <CardDescription>
            Add Meta Pixel tracking to measure conversions and retarget visitors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch id="pixel-enabled" checked={enabled} onCheckedChange={setEnabled} />
            <Label htmlFor="pixel-enabled">Enable Meta Pixel tracking</Label>
          </div>
        </CardContent>
      </Card>

      {enabled && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Meta Pixel ID</Label>
            <Input
              value={pixelId}
              onChange={(e) => setPixelId(e.target.value)}
              placeholder="Enter your Meta Pixel ID..."
            />
            <p className="text-xs text-muted-foreground">
              You can find your Pixel ID in Meta Business Manager
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Custom Events</CardTitle>
              <CardDescription>
                Configure the names of events that will be sent to Meta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>View Event Name</Label>
                <Input
                  value={viewEventName}
                  onChange={(e) => setViewEventName(e.target.value)}
                  placeholder="e.g., SmartLinkView"
                />
              </div>
              <div className="space-y-2">
                <Label>Click Event Name</Label>
                <Input
                  value={clickEventName}
                  onChange={(e) => setClickEventName(e.target.value)}
                  placeholder="e.g., SmartLinkClick"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  );
};

export default MetaPixelStep;