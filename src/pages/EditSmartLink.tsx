import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import ReviewStep from "@/components/create-smart-link/ReviewStep";

const EditSmartLink = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: smartLink, isLoading } = useQuery({
    queryKey: ["smartLink", id],
    queryFn: async () => {
      const { data: smartLink, error } = await supabase
        .from("smart_links")
        .select(`
          *,
          platform_links (
            id,
            platform_id,
            platform_name,
            url
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      // Transform the data to match the format expected by ReviewStep
      return {
        id: smartLink.id,
        title: smartLink.title,
        coverUrl: smartLink.artwork_url,
        releaseDate: smartLink.release_date,
        platforms: smartLink.platform_links.map((link: any) => ({
          id: link.platform_id,
          name: link.platform_name,
          enabled: true,
          url: link.url,
          icon: `/lovable-uploads/${link.platform_id}.png`,
        })),
        metaPixel: {
          enabled: !!smartLink.meta_pixel_id,
          pixelId: smartLink.meta_pixel_id,
          viewEventName: smartLink.meta_view_event,
          clickEventName: smartLink.meta_click_event,
        },
        emailCapture: {
          enabled: smartLink.email_capture_enabled,
          title: smartLink.email_capture_title,
          description: smartLink.email_capture_description,
        },
      };
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </Card>
      </div>
    );
  }

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleComplete = () => {
    navigate("/dashboard");
  };

  const handleEditStep = () => {
    // In edit mode, we don't need to handle step changes
    return;
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Edit Smart Link</h1>
        </div>
        {smartLink && (
          <ReviewStep
            data={smartLink}
            onBack={handleBack}
            onComplete={handleComplete}
            onEditStep={handleEditStep}
            isEditing={true}
          />
        )}
      </Card>
    </div>
  );
};

export default EditSmartLink;