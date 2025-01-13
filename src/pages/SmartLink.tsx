import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SmartLinkHeader from "@/components/smart-link/SmartLinkHeader";
import PlatformButton from "@/components/smart-link/PlatformButton";
import EmailSubscribeForm from "@/components/smart-link/EmailSubscribeForm";

interface Platform {
  id: string;
  name: string;
  color: string;
  icon: string;
  action: string;
}

const platforms: Platform[] = [
  { 
    id: "spotify",
    name: "Spotify", 
    color: "bg-[#1DB954]",
    icon: "/lovable-uploads/spotify.png",
    action: "Play"
  },
  { 
    id: "apple",
    name: "Apple Music", 
    color: "bg-black",
    icon: "/lovable-uploads/applemusic.png",
    action: "Play"
  },
  { 
    id: "amazon",
    name: "Amazon Music", 
    color: "bg-[#00A8E1]",
    icon: "/lovable-uploads/amazonmusic.png",
    action: "Play"
  },
  { 
    id: "youtube_music",
    name: "YouTube Music", 
    color: "bg-[#FF0000]",
    icon: "/lovable-uploads/youtubemusic.png",
    action: "Play"
  },
  { 
    id: "deezer",
    name: "Deezer", 
    color: "bg-[#00C7F2]",
    icon: "/lovable-uploads/deezer.png",
    action: "Play"
  },
  { 
    id: "tidal",
    name: "Tidal", 
    color: "bg-black",
    icon: "/lovable-uploads/tidal.png",
    action: "Play"
  },
  { 
    id: "soundcloud",
    name: "SoundCloud", 
    color: "bg-[#FF5500]",
    icon: "/lovable-uploads/soundcloud.png",
    action: "Play"
  },
  { 
    id: "youtube",
    name: "YouTube", 
    color: "bg-[#FF0000]",
    icon: "/lovable-uploads/youtube.png",
    action: "Watch"
  },
  { 
    id: "itunes",
    name: "iTunes Store", 
    color: "bg-[#FB5BC5]",
    icon: "/lovable-uploads/itunes.png",
    action: "Download"
  },
];

const SmartLink = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: smartLink, isLoading, error } = useQuery({
    queryKey: ['smartLink', slug],
    queryFn: async () => {
      let { data: smartLinkData, error: smartLinkError } = await supabase
        .from('smart_links')
        .select(`
          *,
          platform_links (*)
        `)
        .eq('slug', slug)
        .maybeSingle();

      if (smartLinkError) {
        console.error('Error fetching smart link:', smartLinkError);
        throw smartLinkError;
      }

      if (!smartLinkData) {
        const { data: idData, error: idError } = await supabase
          .from('smart_links')
          .select(`
            *,
            platform_links (*)
          `)
          .eq('id', slug)
          .maybeSingle();

        if (idError) {
          console.error('Error fetching smart link by ID:', idError);
          throw idError;
        }

        if (!idData) {
          console.error('Smart link not found by either slug or ID:', slug);
          throw new Error('Smart link not found');
        }

        smartLinkData = idData;
      }

      await supabase.from('link_views').insert({
        smart_link_id: smartLinkData.id,
        user_agent: navigator.userAgent,
      });

      return smartLinkData;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !smartLink) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-red-500">
          {error ? 'Error loading smart link' : 'Smart link not found'}
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${smartLink.artwork_url})`,
          filter: 'blur(30px) brightness(0.7)',
          transform: 'scale(1.1)'
        }}
      />

      <div className="relative w-full max-w-md mx-auto px-4 py-8 z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl">
          <SmartLinkHeader
            title={smartLink.title}
            artistName={smartLink.artist_name}
            artworkUrl={smartLink.artwork_url}
          />
          
          <div className="space-y-4">
            {smartLink.platform_links.map((platformLink: any) => {
              const platform = platforms.find(p => p.id === platformLink.platform_id);
              if (!platform) return null;

              return (
                <PlatformButton
                  key={platformLink.id}
                  name={platform.name}
                  icon={platform.icon}
                  action={platform.action}
                  url={platformLink.url}
                />
              );
            })}
          </div>

          {smartLink.email_capture_enabled && (
            <EmailSubscribeForm
              smartLinkId={smartLink.id}
              title={smartLink.email_capture_title}
              description={smartLink.email_capture_description}
            />
          )}
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-white/60">Powered by notnoise</p>
        </div>
      </div>
    </div>
  );
};

export default SmartLink;
