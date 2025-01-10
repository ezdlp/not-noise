import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { PencilIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ReviewStepProps {
  data: any;
  onBack: () => void;
  onComplete: () => void;
  onEditStep: (step: number) => void;
}

const ReviewStep = ({ data, onBack, onComplete, onEditStep }: ReviewStepProps) => {
  const handlePublish = () => {
    // In a real app, this would save to a backend
    console.log("Publishing smart link:", data);
    toast.success("Smart link created successfully!");
    onComplete();
  };

  const platformLogos: { [key: string]: string } = {
    spotify: "/lovable-uploads/spotify.png",
    applemusic: "/lovable-uploads/applemusic.png",
    youtubemusic: "/lovable-uploads/youtubemusic.png",
    soundcloud: "/lovable-uploads/soundcloud.png",
    deezer: "/lovable-uploads/deezer.png",
    tidal: "/lovable-uploads/tidal.png",
    amazonmusic: "/lovable-uploads/amazonmusic.png",
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Review and Publish</h2>
        <p className="text-sm text-muted-foreground">
          Review your smart link details before publishing
        </p>
      </div>

      {/* Track Details Section */}
      <Card className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <h3 className="font-medium text-lg">Track Details</h3>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => onEditStep(2)}
          >
            <PencilIcon className="w-4 h-4" />
            Edit
          </Button>
        </div>
        
        <div className="flex gap-6">
          <img
            src={data.coverUrl}
            alt={`${data.title} cover`}
            className="w-32 h-32 rounded-lg object-cover shadow-md"
          />
          <div className="space-y-2">
            <h4 className="font-semibold text-xl">{data.title}</h4>
            <p className="text-muted-foreground">{data.artist}</p>
            <p className="text-sm text-muted-foreground">Album: {data.album}</p>
            <p className="text-sm text-primary">srsr.li/{data.slug}</p>
            {data.description && (
              <p className="text-sm text-muted-foreground mt-2">
                {data.description}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Platforms Section */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-medium text-lg">Streaming Platforms</h3>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => onEditStep(3)}
          >
            <PencilIcon className="w-4 h-4" />
            Edit
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {data.platforms.map((platform: any) => (
            <div
              key={platform.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card/50"
            >
              <img
                src={platformLogos[platform.id.toLowerCase()] || ''}
                alt={platform.name}
                className="w-8 h-8 object-contain"
              />
              <div className="text-sm">
                <p className="font-medium">{platform.name}</p>
                <a
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline truncate block max-w-[200px]"
                >
                  View Link
                </a>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Meta Pixel Section */}
      {data.metaPixel?.enabled && (
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-medium text-lg">Meta Pixel Configuration</h3>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => onEditStep(4)}
            >
              <PencilIcon className="w-4 h-4" />
              Edit
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Pixel ID:</span>{" "}
              <span className="text-muted-foreground">{data.metaPixel.pixelId}</span>
            </p>
            <p className="text-sm">
              <span className="font-medium">View Event:</span>{" "}
              <span className="text-muted-foreground">{data.metaPixel.viewEventName}</span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Click Event:</span>{" "}
              <span className="text-muted-foreground">{data.metaPixel.clickEventName}</span>
            </p>
          </div>
        </Card>
      )}

      {/* Email Capture Section */}
      {data.emailCapture?.enabled && (
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-medium text-lg">Email Capture Form</h3>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => onEditStep(5)}
            >
              <PencilIcon className="w-4 h-4" />
              Edit
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Form Title:</span>{" "}
              <span className="text-muted-foreground">{data.emailCapture.title}</span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Description:</span>{" "}
              <span className="text-muted-foreground">{data.emailCapture.description}</span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Button Text:</span>{" "}
              <span className="text-muted-foreground">{data.emailCapture.buttonText}</span>
            </p>
          </div>
        </Card>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handlePublish} className="px-8">
          Create Smart Link
        </Button>
      </div>
    </div>
  );
};

export default ReviewStep;