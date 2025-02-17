
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ListMusic, Music, Mail, Share2, BarChart } from "lucide-react";

interface ReviewStepProps {
  data: {
    title: string;
    artist: string;
    artworkUrl: string;
    description?: string;
    platforms: Array<{
      id: string;
      name: string;
      url: string;
      enabled: boolean;
    }>;
    meta_pixel_id?: string;
    meta_view_event?: string;
    meta_click_event?: string;
    email_capture_enabled?: boolean;
    email_capture_title?: string;
    email_capture_description?: string;
    content_type?: 'track' | 'album' | 'playlist';
    slug?: string;
  };
  onBack: () => void;
  onComplete?: () => void;
  onEditStep?: (step: number) => void;
}

const ReviewStep = ({ data, onBack, onComplete, onEditStep }: ReviewStepProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const isPlaylist = data.content_type === 'playlist';

  const handleCreate = async () => {
    setIsCreating(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        throw new Error("Not authenticated");
      }

      const { error: createError } = await supabase
        .from("smart_links")
        .insert({
          title: data.title,
          artist_name: data.artist,
          artwork_url: data.artworkUrl,
          description: data.description,
          content_type: data.content_type || 'track',
          meta_pixel_id: data.meta_pixel_id,
          meta_view_event: data.meta_view_event,
          meta_click_event: data.meta_click_event,
          email_capture_enabled: data.email_capture_enabled,
          email_capture_title: data.email_capture_title,
          email_capture_description: data.email_capture_description,
          slug: data.slug,
          user_id: session.session.user.id
        });

      if (createError) throw createError;

      toast.success("Smart link created successfully!");
      if (onComplete) {
        onComplete();
      }
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating smart link:", error);
      toast.error("Failed to create smart link. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Review Your Smart Link
        </h1>
        <p className="font-sans text-base text-[#374151]">
          Review the details before creating your {isPlaylist ? 'playlist' : 'release'} smart link
        </p>
      </div>

      <div className="space-y-6">
        <Card className="p-6 shadow-sm border border-[#E6E6E6]">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-shrink-0">
              <img
                src={data.artworkUrl || "/placeholder.svg"}
                alt={isPlaylist ? "Playlist artwork" : "Release artwork"}
                className="w-40 h-40 sm:w-32 sm:h-32 rounded-lg object-cover shadow-sm border border-[#E6E6E6]"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = "/placeholder.svg";
                }}
              />
            </div>
            <div className="space-y-4 flex-1">
              <div>
                <Badge 
                  variant="secondary"
                  className="mb-3 bg-[#ECE9FF] text-[#6851FB] hover:bg-[#D0C7FF] font-sans"
                >
                  {isPlaylist ? (
                    <ListMusic className="w-3 h-3 mr-1.5" />
                  ) : (
                    <Music className="w-3 h-3 mr-1.5" />
                  )}
                  {data.content_type?.charAt(0).toUpperCase() + data.content_type?.slice(1)}
                </Badge>
                <h2 className="font-heading text-xl font-semibold text-[#111827]">
                  {data.title}
                </h2>
                {!isPlaylist && (
                  <p className="font-sans text-base text-[#6B7280] mt-1">
                    {data.artist}
                  </p>
                )}
              </div>
              {data.description && (
                <p className="font-sans text-base text-[#6B7280]">
                  {data.description}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-sm border border-[#E6E6E6]">
          <h3 className="font-heading text-lg font-semibold text-[#111827] flex items-center gap-2 mb-4">
            <Share2 className="w-5 h-5" />
            Platforms
          </h3>
          <div className="space-y-3">
            {data.platforms.filter(p => p.enabled).map((platform) => (
              <div key={platform.id} className="flex items-center gap-3">
                <img
                  src={`/lovable-uploads/${platform.id}.png`}
                  alt={platform.name}
                  className="w-5 h-5"
                />
                <span className="font-sans text-base text-[#374151]">
                  {platform.name}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {data.meta_pixel_id && (
          <Card className="p-6 shadow-sm border border-[#E6E6E6]">
            <h3 className="font-heading text-lg font-semibold text-[#111827] flex items-center gap-2 mb-4">
              <BarChart className="w-5 h-5" />
              Meta Pixel Integration
            </h3>
            <div className="space-y-3">
              <p className="font-sans text-base text-[#374151]">
                <span className="font-medium">Pixel ID:</span> {data.meta_pixel_id}
              </p>
              {data.meta_view_event && (
                <p className="font-sans text-base text-[#374151]">
                  <span className="font-medium">View Event:</span> {data.meta_view_event}
                </p>
              )}
              {data.meta_click_event && (
                <p className="font-sans text-base text-[#374151]">
                  <span className="font-medium">Click Event:</span> {data.meta_click_event}
                </p>
              )}
            </div>
          </Card>
        )}

        {data.email_capture_enabled && (
          <Card className="p-6 shadow-sm border border-[#E6E6E6]">
            <h3 className="font-heading text-lg font-semibold text-[#111827] flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5" />
              Email Capture
            </h3>
            <div className="space-y-3">
              <p className="font-sans font-medium text-[#111827]">
                {data.email_capture_title}
              </p>
              <p className="font-sans text-base text-[#6B7280]">
                {data.email_capture_description}
              </p>
            </div>
          </Card>
        )}
      </div>

      <div className="flex justify-between pt-6">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="bg-white text-[#0F0F0F] hover:bg-[#F3F3F3] active:bg-[#E6E6E6] h-10 px-4 shadow-sm border border-[#E6E6E6]"
        >
          Back
        </Button>
        <Button 
          onClick={handleCreate} 
          disabled={isCreating}
          className="bg-[#6851FB] hover:bg-[#4A47A5] active:bg-[#271153] disabled:bg-[#ECE9FF] h-10 px-4 text-white font-sans font-medium"
        >
          {isCreating ? "Creating..." : "Create Smart Link"}
        </Button>
      </div>
    </div>
  );
};

export default ReviewStep;
