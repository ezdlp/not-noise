
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradeModal } from "../subscription/UpgradeModal";
import { Lock } from "lucide-react";

interface EmailCaptureStepProps {
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

const EmailCaptureStep = ({
  initialData,
  onNext,
  onBack,
}: EmailCaptureStepProps) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { isFeatureEnabled } = useFeatureAccess();
  const canUseEmailCapture = isFeatureEnabled('email_capture');
  
  const [enabled, setEnabled] = useState(false);
  const [title, setTitle] = useState("Subscribe to my newsletter");
  const [description, setDescription] = useState(
    "Stay updated with my latest releases"
  );
  const [buttonText, setButtonText] = useState("Subscribe");

  const handleNext = () => {
    onNext({
      ...initialData,
      emailCapture: {
        enabled: canUseEmailCapture && enabled,
        title,
        description,
        buttonText,
      },
    });
  };

  const handleToggle = () => {
    if (!canUseEmailCapture) {
      setShowUpgradeModal(true);
      return;
    }
    setEnabled(!enabled);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Email Capture Form</h2>
        <p className="text-sm text-muted-foreground">
          Add an email capture form to grow your mailing list
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="email-capture"
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={!canUseEmailCapture}
        />
        <Label htmlFor="email-capture" className="flex items-center gap-2">
          Enable email capture form
          {!canUseEmailCapture && (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
        </Label>
      </div>
      {enabled && canUseEmailCapture && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Form Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter form title..."
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter form description..."
            />
          </div>
          <div className="space-y-2">
            <Label>Button Text</Label>
            <Input
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              placeholder="Enter button text..."
            />
          </div>
        </div>
      )}
      {!canUseEmailCapture && (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <Lock className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">Premium Feature</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upgrade to collect emails from your fans
          </p>
          <Button variant="outline" onClick={() => setShowUpgradeModal(true)}>
            Upgrade to Pro
          </Button>
        </div>
      )}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext}>Next</Button>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="collect emails from your fans"
        description="Grow your fanbase by collecting emails through your smart links"
      />
    </div>
  );
};

export default EmailCaptureStep;
