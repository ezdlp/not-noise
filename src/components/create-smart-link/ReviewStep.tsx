import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ReviewStepProps {
  data: any;
  onBack: () => void;
  onComplete: () => void;
  onEditStep: (step: number) => void;
  isEditing?: boolean;
}

const ReviewStep = ({ data, onBack, onComplete, onEditStep, isEditing = false }: ReviewStepProps) => {
  const navigate = useNavigate();

  const handlePublish = async () => {
    try {
      console.info("Publishing smart link:", data);

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) {
        toast.error("You must be logged in to create a smart link");
        return;
      }

      if (isEditing) {
        // Update existing smart link
        const { error: smartLinkError } = await supabase
          .from("smart_links")
          .update({
            artwork_url: data.coverUrl,
            release_date: new Date(data.releaseDate).toISOString(),
            meta_pixel_id: data.metaPixel?.enabled ? data.metaPixel.pixelId : null,
            meta_view_event: data.metaPixel?.enabled ? data.metaPixel.viewEventName : null,
            meta_click_event: data.metaPixel?.enabled ? data.metaPixel.clickEventName : null,
            email_capture_enabled: data.emailCapture?.enabled || false,
            email_capture_title: data.emailCapture?.title || null,
            email_capture_description: data.emailCapture?.description || null,
            title: data.title,
            artist_name: data.artist,
            slug: data.slug
          })
          .eq('id', data.id);

        if (smartLinkError) throw smartLinkError;

        // Delete existing platform links
        const { error: deleteError } = await supabase
          .from("platform_links")
          .delete()
          .eq('smart_link_id', data.id);

        if (deleteError) throw deleteError;

        // Insert new platform links
        const platformLinksToInsert = data.platforms
          .filter((platform: any) => platform.enabled)
          .map((platform: any) => ({
            smart_link_id: data.id,
            platform_id: platform.id,
            platform_name: platform.name,
            url: platform.url,
          }));

        const { error: platformLinksError } = await supabase
          .from("platform_links")
          .insert(platformLinksToInsert);

        if (platformLinksError) throw platformLinksError;

        toast.success("Smart link updated successfully!");
      } else {
        // Create new smart link
        const { data: smartLink, error: smartLinkError } = await supabase
          .from("smart_links")
          .insert({
            artwork_url: data.coverUrl,
            release_date: new Date(data.releaseDate).toISOString(),
            meta_pixel_id: data.metaPixel?.enabled ? data.metaPixel.pixelId : null,
            meta_view_event: data.metaPixel?.enabled ? data.metaPixel.viewEventName : null,
            meta_click_event: data.metaPixel?.enabled ? data.metaPixel.clickEventName : null,
            email_capture_enabled: data.emailCapture?.enabled || false,
            email_capture_title: data.emailCapture?.title || null,
            email_capture_description: data.emailCapture?.description || null,
            title: data.title,
            artist_name: data.artist,
            user_id: session.session.user.id,
            slug: data.slug
          })
          .select()
          .single();

        if (smartLinkError) throw smartLinkError;

        // Insert platform links
        const platformLinksToInsert = data.platforms
          .filter((platform: any) => platform.enabled)
          .map((platform: any) => ({
            smart_link_id: smartLink.id,
            platform_id: platform.id,
            platform_name: platform.name,
            url: platform.url,
          }));

        const { error: platformLinksError } = await supabase
          .from("platform_links")
          .insert(platformLinksToInsert);

        if (platformLinksError) throw platformLinksError;

        toast.success("Smart link created successfully!");
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving smart link:", error);
      toast.error("Failed to save smart link. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Review Your Smart Link</h2>
        <p className="text-sm text-muted-foreground">
          Review your smart link details before {isEditing ? "saving" : "publishing"}
        </p>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-4">
          <img
            src={data.artworkUrl || "/placeholder.svg"}
            alt={`${data.title} cover`}
            className="w-24 h-24 object-cover rounded-lg"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              console.error("Failed to load review artwork:", data.artworkUrl);
              img.src = "/placeholder.svg";
            }}
          />
          <div>
            <h3 className="font-semibold text-lg">{data.title}</h3>
            <p className="text-muted-foreground">{data.artist}</p>
            <p className="text-sm text-muted-foreground mt-1">{data.album}</p>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <h3 className="font-medium">Enabled Platforms</h3>
        <div className="grid gap-2">
          {data.platforms
            .filter((platform: any) => platform.enabled)
            .map((platform: any) => (
              <Card key={platform.id} className="p-3">
                <div className="flex items-center gap-3">
                  <img
                    src={platform.icon}
                    alt={`${platform.name} logo`}
                    className="w-6 h-6"
                  />
                  <span>{platform.name}</span>
                </div>
              </Card>
            ))}
        </div>
      </div>

      {data.metaPixel?.enabled && (
        <div className="space-y-2">
          <h3 className="font-medium">Meta Pixel</h3>
          <p className="text-sm text-muted-foreground">
            Meta Pixel ID: {data.metaPixel.pixelId}
          </p>
        </div>
      )}

      {data.emailCapture?.enabled && (
        <div className="space-y-2">
          <h3 className="font-medium">Email Capture</h3>
          <p className="text-sm text-muted-foreground">
            {data.emailCapture.title}
          </p>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handlePublish}>
          {isEditing ? "Save Changes" : "Publish Smart Link"}
        </Button>
      </div>
    </div>
  );
};

export default ReviewStep;