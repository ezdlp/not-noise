import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface ReviewStepProps {
  data: any;
  onBack: () => void;
  onComplete: () => void;
}

const ReviewStep = ({ data, onBack, onComplete }: ReviewStepProps) => {
  const handlePublish = () => {
    // Temporary mock publish action
    toast.success("Smart link created successfully!");
    onComplete();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Review and Publish</h2>
        <p className="text-sm text-muted-foreground">
          Review your smart link details before publishing
        </p>
      </div>
      <Card className="p-4 space-y-4">
        <div>
          <h3 className="font-medium">Track Details</h3>
          <p className="text-sm text-muted-foreground">
            {data.title} by {data.artist}
          </p>
          <p className="text-sm text-muted-foreground">Slug: {data.slug}</p>
        </div>
        <div>
          <h3 className="font-medium">Platforms</h3>
          <ul className="text-sm text-muted-foreground">
            {data.platforms.map((platform: any) => (
              <li key={platform.id}>{platform.name}</li>
            ))}
          </ul>
        </div>
        {data.emailCapture.enabled && (
          <div>
            <h3 className="font-medium">Email Capture Form</h3>
            <p className="text-sm text-muted-foreground">
              {data.emailCapture.title}
            </p>
          </div>
        )}
      </Card>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handlePublish}>Create Smart Link</Button>
      </div>
    </div>
  );
};

export default ReviewStep;