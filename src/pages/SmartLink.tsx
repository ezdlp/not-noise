import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PlatformButton from "@/components/smart-link/PlatformButton";
import EmailSubscribeForm from "@/components/smart-link/EmailSubscribeForm";
import { useEffect } from "react";

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

  useEffect(() => {
    if (smartLink?.meta_pixel_id) {
      // Initialize Meta Pixel
      const initPixel = () => {
        (function(f,b,e,v,n,t,s) {
          if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)})(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          
        fbq('init', smartLink.meta_pixel_id);
        fbq('track', smartLink.meta_view_event || 'SmartLinkView');
      };

      initPixel();
    }
  }, [smartLink?.meta_pixel_id]);

  const handlePlatformClick = async (platformId: string) => {
    if (!smartLink) return;

    try {
      await supabase.from('platform_clicks').insert({
        platform_link_id: platformId,
        user_agent: navigator.userAgent,
      });

      // Track click event with Meta Pixel if enabled
      if (smartLink.meta_pixel_id) {
        fbq('track', smartLink.meta_click_event || 'SmartLinkClick');
      }
    } catch (error) {
      console.error('Error recording platform click:', error);
    }
  };

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

  const platforms = [
    { id: "spotify", name: "Spotify", icon: "/lovable-uploads/spotify.png" },
    { id: "youtubeMusic", name: "YouTube Music", icon: "/lovable-uploads/youtubemusic.png" },
    { id: "youtube", name: "YouTube", icon: "/lovable-uploads/youtube.png" },
    { id: "appleMusic", name: "Apple Music", icon: "/lovable-uploads/applemusic.png" },
    { id: "amazonMusic", name: "Amazon Music", icon: "/lovable-uploads/amazonmusic.png" },
    { id: "deezer", name: "Deezer", icon: "/lovable-uploads/deezer.png" },
    { id: "soundcloud", name: "SoundCloud", icon: "/lovable-uploads/soundcloud.png" },
    { id: "itunes", name: "iTunes Store", icon: "/lovable-uploads/itunes.png" },
  ];

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
          <div className="flex items-center gap-4 mb-6">
            <img
              src={smartLink.artwork_url}
              alt={`${smartLink.title} artwork`}
              className="w-24 h-24 object-cover rounded-lg shadow-md"
            />
            <div>
              <h1 className="text-xl font-bold">{smartLink.title}</h1>
              <p className="text-gray-600">{smartLink.artist_name}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {smartLink.platform_links.map((platformLink: any) => {
              const platform = platforms.find(p => p.id === platformLink.platform_id);
              if (!platform) return null;

              return (
                <PlatformButton
                  key={platformLink.id}
                  name={platform.name}
                  icon={platform.icon}
                  action="Play"
                  url={platformLink.url}
                  onClick={() => handlePlatformClick(platformLink.id)}
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