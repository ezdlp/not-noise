import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
    id: "amazonmusic",
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
      console.log('Fetching smart link with slug:', slug);

      let { data: smartLinkData, error: smartLinkError } = await supabase
        .from('smart_links')
        .select(`
          *,
          profiles (
            artist_name
          )
        `)
        .eq('slug', slug)
        .maybeSingle();

      if (smartLinkError) {
        console.error('Error fetching smart link:', smartLinkError);
        throw smartLinkError;
      }

      // If no data found by slug, try fetching by ID as fallback
      if (!smartLinkData) {
        console.log('No smart link found by slug, trying ID...');
        const { data: idData, error: idError } = await supabase
          .from('smart_links')
          .select(`
            *,
            profiles (
              artist_name
            )
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

        console.log('Found smart link by ID:', idData);
        smartLinkData = idData;
      } else {
        console.log('Found smart link by slug:', smartLinkData);
      }

      // Fetch the platform links for this smart link
      const { data: platformLinks, error: platformLinksError } = await supabase
        .from('platform_links')
        .select('*')
        .eq('smart_link_id', smartLinkData.id);

      if (platformLinksError) {
        console.error('Error fetching platform links:', platformLinksError);
        throw platformLinksError;
      }

      console.log('Found platform links:', platformLinks);

      return {
        ...smartLinkData,
        platformLinks: platformLinks || []
      };
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
          <div className="text-center mb-8">
            <img
              src={smartLink.artwork_url}
              alt="Album Cover"
              className="w-72 h-72 mx-auto rounded-2xl shadow-xl mb-6 object-cover"
            />
            <h1 className="text-2xl font-bold mb-1 text-gray-900">{smartLink.title}</h1>
            {smartLink.profiles?.artist_name && (
              <p className="text-lg text-gray-600">{smartLink.profiles.artist_name}</p>
            )}
          </div>
          
          <div className="space-y-4">
            {smartLink.platformLinks.map((platformLink) => {
              const platform = platforms.find(p => p.id === platformLink.platform_id);
              if (!platform) return null;

              return (
                <div 
                  key={platformLink.id}
                  className="flex items-center justify-between p-3 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={platform.icon} 
                      alt={`${platform.name} logo`}
                      className="w-8 h-8 object-contain"
                    />
                    <span className="font-medium text-gray-900">{platform.name}</span>
                  </div>
                  <Button
                    variant="default"
                    className="bg-black hover:bg-black/90 text-white min-w-[100px]"
                    onClick={() => window.open(platformLink.url, '_blank')}
                  >
                    {platform.action}
                  </Button>
                </div>
              );
            })}
          </div>

          {smartLink.email_capture_enabled && (
            <div className="mt-8 p-6 bg-gray-50 rounded-xl">
              <h3 className="text-lg font-semibold mb-2">
                {smartLink.email_capture_title || "Subscribe to my newsletter"}
              </h3>
              <p className="text-gray-600 mb-4">
                {smartLink.email_capture_description || "Stay updated with my latest releases"}
              </p>
              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full"
                />
                <Button className="w-full">Subscribe</Button>
              </div>
            </div>
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