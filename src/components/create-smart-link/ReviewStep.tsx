import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ListMusic, Music, Mail, Share2, BarChart, Edit } from "lucide-react";

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
    metaPixel?: {
      enabled: boolean;
      pixelId: string;
      viewEventName: string;
      clickEventName: string;
    };
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

const getPlatformIcon = (platformId: string): string => {
  const iconMap: { [key: string]: string } = {
    spotify: "spotify",
    appleMusic: "applemusic",
    amazonMusic: "amazonmusic",
    youtubeMusic: "youtubemusic",
    deezer: "deezer",
    soundcloud: "soundcloud",
    youtube: "youtube",
    itunes: "itunes",
    tidal: "tidal",
    anghami: "anghami",
    napster: "napster",
    boomplay: "boomplay",
    yandex: "yandex",
    beatport: "beatport",
    bandcamp: "bandcamp",
    audius: "audius",
  };
  
  return `/lovable-uploads/${iconMap[platformId] || platformId}.png`;
};

const ReviewStep = ({ data, onBack, onComplete, onEditStep }: ReviewStepProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const isPlaylist = data.content_type === 'playlist';
  const enabledPlatforms = data.platforms?.filter(p => p.enabled) || [];

  const handleCreate = async () => {
    console.log("Creating smart link with data:", data);
    setIsCreating(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        throw new Error("Not authenticated");
      }

      // Get current user's profile for artist name fallback
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('artist_name')
        .eq('id', session.session.user.id)
        .single();

      // For playlists, use the user's artist name or a default as curator
      const artistName = isPlaylist 
        ? (userProfile?.artist_name || 'Playlist Curator')
        : data.artist;

      // Create base smart link data
      const smartLinkData = {
        title: data.title,
        artist_name: artistName,
        artwork_url: data.artworkUrl,
        description: data.description,
        content_type: data.content_type || 'track',
        email_capture_enabled: data.email_capture_enabled,
        email_capture_title: data.email_capture_title,
        email_capture_description: data.email_capture_description,
        slug: data.slug,
        user_id: session.session.user.id,
      };

      // Add Meta Pixel data if it exists
      if (data.metaPixel?.enabled) {
        smartLinkData['meta_pixel_id'] = data.metaPixel.pixelId;
        smartLinkData['meta_view_event'] = data.metaPixel.viewEventName;
        smartLinkData['meta_click_event'] = data.metaPixel.clickEventName;
      }

      // Add playlist metadata if it's a playlist
      if (isPlaylist) {
        smartLinkData['playlist_metadata'] = {
          curator: artistName,
          platform_data: enabledPlatforms.map(p => ({
            platform: p.name,
            url: p.url
          }))
        };
      }

      // First, insert the smart link and get back the ID
      const { data: smartLink, error: createError } = await supabase
        .from("smart_links")
        .insert(smartLinkData)
        .select()
        .single();

      if (createError) throw createError;
      if (!smartLink) throw new Error("Failed to create smart link");

      // Then, insert platform links if there are any enabled platforms
      if (enabledPlatforms.length > 0) {
        const platformLinksData = enabledPlatforms.map(platform => ({
          smart_link_id: smartLink.id,
          platform_id: platform.id,
          platform_name: platform.name,
          url: platform.url
        }));

        const { error: platformError } = await supabase
          .from("platform_links")
          .insert(platformLinksData);

        if (platformError) throw platformError;
      }

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

  const SectionHeader = ({ 
    title, 
    icon: Icon, 
    stepNumber, 
    isConfigured 
  }: { 
    title: string; 
    icon: any; 
    stepNumber: number;
    isConfigured: boolean;
  }) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-[#6851FB]" />
        <h3 className="font-heading text-lg font-semibold text-[#111827]">
          {title}
        </h3>
        {isConfigured ? (
          <Badge variant="secondary" className="ml-2 bg-[#ECFDF5] text-[#059669]">
            Enabled
          </Badge>
        ) : (
          <Badge variant="secondary" className="ml-2 bg-[#F5F5F5] text-[#6B7280]">
            Not Enabled
          </Badge>
        )}
      </div>
      {onEditStep && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEditStep(stepNumber)}
          className="text-[#6851FB] hover:text-[#4A47A5] hover:bg-[#ECE9FF]"
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </Button>
      )}
    </div>
  );

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
          <SectionHeader 
            title="Basic Information" 
            icon={isPlaylist ? ListMusic : Music}
            stepNumber={2}
            isConfigured={true}
          />
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
              {data.slug && (
                <div className="pt-2">
                  <p className="font-sans text-sm text-[#6B7280]">
                    Custom URL: <span className="text-[#111827]">soundraiser.io/link/{data.slug}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-sm border border-[#E6E6E6]">
          <SectionHeader 
            title="Streaming Platforms" 
            icon={Share2}
            stepNumber={3}
            isConfigured={enabledPlatforms.length > 0}
          />
          <div className="space-y-4">
            <p className="font-sans text-sm text-[#6B7280]">
              Available on {enabledPlatforms.length} platform{enabledPlatforms.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {enabledPlatforms.map((platform) => (
                <div key={platform.id} className="flex items-center gap-3 p-3 rounded-md border border-[#E6E6E6] bg-white">
                  <img
                    src={getPlatformIcon(platform.id)}
                    alt={platform.name}
                    className="w-5 h-5"
                  />
                  <span className="font-sans text-base text-[#374151]">
                    {platform.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-sm border border-[#E6E6E6]">
          <SectionHeader 
            title="Meta Pixel Integration" 
            icon={BarChart}
            stepNumber={4}
            isConfigured={!!data.meta_pixel_id}
          />
          {data.meta_pixel_id ? (
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
          ) : (
            <p className="font-sans text-base text-[#6B7280]">
              Meta Pixel tracking is not enabled for this smart link.
            </p>
          )}
        </Card>

        <Card className="p-6 shadow-sm border border-[#E6E6E6]">
          <SectionHeader 
            title="Email Capture" 
            icon={Mail}
            stepNumber={5}
            isConfigured={!!data.email_capture_enabled}
          />
          {data.email_capture_enabled ? (
            <div className="space-y-3">
              <p className="font-sans font-medium text-[#111827]">
                {data.email_capture_title}
              </p>
              <p className="font-sans text-base text-[#6B7280]">
                {data.email_capture_description}
              </p>
            </div>
          ) : (
            <p className="font-sans text-base text-[#6B7280]">
              Email capture form is not enabled for this smart link.
            </p>
          )}
        </Card>
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
