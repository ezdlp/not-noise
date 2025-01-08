import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
        enabled,
        title,
        description,
        buttonText,
      },
    });
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
          onCheckedChange={setEnabled}
        />
        <Label htmlFor="email-capture">Enable email capture form</Label>
      </div>
      {enabled && (
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
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  );
};

export default EmailCaptureStep;