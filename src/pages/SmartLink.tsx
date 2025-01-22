import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PlatformButton from "@/components/smart-link/PlatformButton";
import EmailSubscribeForm from "@/components/smart-link/EmailSubscribeForm";
import { useEffect } from "react";
import SmartLinkHeader from "@/components/smart-link/SmartLinkHeader";

const SmartLink = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: smartLink, isLoading, error } = useQuery({
    queryKey: ['smartLink', slug],
    queryFn: async () => {
      console.log("Fetching smart link with slug or ID:", slug);
      
      let { data: smartLinkData, error: smartLinkError } = await supabase
        .from('smart_links')
        .select(`
          *,
          platform_links (
            id,
            platform_id,
            platform_name,
            url
          )
        `)
        .eq('slug', slug)
        .maybeSingle();

      if (smartLinkError) {
        console.error('Error fetching smart link:', smartLinkError);
        throw smartLinkError;
      }

      if (!smartLinkData) {
        console.log("No smart link found with slug, trying ID...");
        const { data: idData, error: idError } = await supabase
          .from('smart_links')
          .select(`
            *,
            platform_links (
              id,
              platform_id,
              platform_name,
              url
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

        smartLinkData = idData;
      }

      console.log("Found smart link:", smartLinkData);

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

  console.log("Platform links:", smartLink.platform_links);

  const platformIcons: { [key: string]: string } = {
    spotify: "/lovable-uploads/spotify.png",
    youtubeMusic: "/lovable-uploads/youtubemusic.png",
    youtube: "/lovable-uploads/youtube.png",
    appleMusic: "/lovable-uploads/applemusic.png",
    amazonMusic: "/lovable-uploads/amazonmusic.png",
    deezer: "/lovable-uploads/deezer.png",
    soundcloud: "/lovable-uploads/soundcloud.png",
    itunes: "/lovable-uploads/itunes.png",
    tidal: "/lovable-uploads/tidal.png",
    anghami: "/lovable-uploads/anghami.png",
    napster: "/lovable-uploads/napster.png",
    boomplay: "/lovable-uploads/boomplay.png",
    yandex: "/lovable-uploads/yandex.png",
    beatport: "/lovable-uploads/beatport.png",
    bandcamp: "/lovable-uploads/bandcamp.png",
    audius: "/lovable-uploads/audius.png",
  };

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
            {smartLink.platform_links && smartLink.platform_links.map((platformLink) => {
              const icon = platformIcons[platformLink.platform_id];
              if (!icon) {
                console.warn(`No icon found for platform: ${platformLink.platform_id}`);
                return null;
              }

              return (
                <PlatformButton
                  key={platformLink.id}
                  name={platformLink.platform_name || platformLink.platform_id}
                  icon={icon}
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