
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ListMusic, Music, Mail, Share2 } from "lucide-react";

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
}

const ReviewStep = ({ data, onBack }: ReviewStepProps) => {
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
        .insert([
          {
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
          },
        ]);

      if (createError) throw createError;

      toast.success("Smart link created successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating smart link:", error);
      toast.error("Failed to create smart link. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg sm:text-xl font-semibold">Review Your Smart Link</h2>
        <p className="text-sm text-muted-foreground">
          Review the details before creating your {isPlaylist ? 'playlist' : 'release'} smart link
        </p>
      </div>

      <div className="space-y-6">
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-shrink-0">
              <img
                src={data.artworkUrl || "/placeholder.svg"}
                alt={isPlaylist ? "Playlist artwork" : "Release artwork"}
                className="w-40 h-40 sm:w-32 sm:h-32 rounded-lg object-cover"
              />
            </div>
            <div className="space-y-4 flex-1">
              <div>
                <Badge 
                  variant="secondary"
                  className="mb-2 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {isPlaylist ? (
                    <ListMusic className="w-3 h-3 mr-1" />
                  ) : (
                    <Music className="w-3 h-3 mr-1" />
                  )}
                  {data.content_type?.charAt(0).toUpperCase() + data.content_type?.slice(1)}
                </Badge>
                <h3 className="text-xl font-semibold">{data.title}</h3>
                <p className="text-muted-foreground">{data.artist}</p>
              </div>
              {data.description && (
                <p className="text-sm text-muted-foreground">{data.description}</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Platforms
          </h3>
          <div className="space-y-2">
            {data.platforms.filter(p => p.enabled).map((platform) => (
              <div key={platform.id} className="flex items-center gap-2 text-sm">
                <img
                  src={`/lovable-uploads/${platform.id}.png`}
                  alt={platform.name}
                  className="w-5 h-5"
                />
                <span>{platform.name}</span>
              </div>
            ))}
          </div>
        </Card>

        {data.email_capture_enabled && (
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Capture
            </h3>
            <div className="space-y-2">
              <p className="font-medium">{data.email_capture_title}</p>
              <p className="text-sm text-muted-foreground">
                {data.email_capture_description}
              </p>
            </div>
          </Card>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleCreate} disabled={isCreating}>
          {isCreating ? "Creating..." : "Create Smart Link"}
        </Button>
      </div>
    </div>
  );
};

export default ReviewStep;
