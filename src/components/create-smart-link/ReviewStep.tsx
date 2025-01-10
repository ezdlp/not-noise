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
    // In a real app, this would save to a backend
    console.log("Publishing smart link:", data);
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
          {data.description && (
            <p className="text-sm text-muted-foreground mt-2">
              Description: {data.description}
            </p>
          )}
        </div>
        <div>
          <h3 className="font-medium">Platforms</h3>
          <ul className="text-sm text-muted-foreground">
            {data.platforms.map((platform: any) => (
              <li key={platform.id} className="mt-1">
                {platform.name}: {platform.url}
              </li>
            ))}
          </ul>
        </div>
        {data.metaPixel?.enabled && (
          <div>
            <h3 className="font-medium">Meta Pixel Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Pixel ID: {data.metaPixel.pixelId}
            </p>
            <p className="text-sm text-muted-foreground">
              View Event: {data.metaPixel.viewEventName}
            </p>
            <p className="text-sm text-muted-foreground">
              Click Event: {data.metaPixel.clickEventName}
            </p>
          </div>
        )}
        {data.emailCapture?.enabled && (
          <div>
            <h3 className="font-medium">Email Capture Form</h3>
            <p className="text-sm text-muted-foreground">
              Title: {data.emailCapture.title}
            </p>
            <p className="text-sm text-muted-foreground">
              Description: {data.emailCapture.description}
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