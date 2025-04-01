
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PlatformButton from "@/components/smart-link/PlatformButton";
import EmailSubscribeForm from "@/components/smart-link/EmailSubscribeForm";
import { useEffect } from "react";
import SmartLinkHeader from "@/components/smart-link/SmartLinkHeader";
import { SmartLinkSEO } from "@/components/seo/SmartLinkSEO";
import { analyticsService } from "@/services/analyticsService";
import { analytics } from "@/services/analytics";
import { Loader2 } from "lucide-react";

export default function SmartLink() {
  const { slug } = useParams<{ slug: string }>();

  useEffect(() => {
    analytics.initialize(true);
    analytics.trackPageView(`/link/${slug}`);
    
    // If this is the initial page load and we're on a smart link,
    // check the URL for the escaped fragment and update the meta tags
    // This helps with SEO for crawlers
    if (window.location.search.includes('_escaped_fragment_')) {
      console.log('Escaped fragment detected, preparing for crawler view');
      
      // This is an important signal that we need to optimize for crawlers
      document.documentElement.setAttribute('data-crawler-view', 'true');
    }
  }, [slug]);

  const recordViewMutation = useMutation({
    mutationFn: async (smartLinkId: string) => {
      try {
        await analyticsService.trackPageView(`/link/${slug}`);
        
        const locationInfo = await analyticsService.getLocationInfo();
        
        await supabase.from('link_views').insert({
          smart_link_id: smartLinkId,
          user_agent: navigator.userAgent,
          country_code: locationInfo?.country_code,
          ip_hash: locationInfo?.ip_hash
        });

        console.log('View recorded successfully with location:', locationInfo?.country_code);
      } catch (error) {
        console.error('Error recording view:', error);
      }
    }
  });

  const { data: smartLink, isLoading, error } = useQuery({
    queryKey: ['smartLink', slug],
    queryFn: async () => {
      console.log("Fetching smart link with slug:", slug);
      
      let smartLinkData;
      
      try {
        const { data: slugData, error: smartLinkError } = await supabase
          .from('smart_links')
          .select(`
            *,
            platform_links (
              id,
              platform_id,
              platform_name,
              url
            ),
            profiles:user_id (
              hide_branding
            )
          `)
          .eq('slug', slug)
          .maybeSingle();

        console.log("Slug query result:", { data: slugData, error: smartLinkError });

        if (!slugData && !smartLinkError) {
          console.log("Attempting to fetch by ID:", slug);
          const { data: idData, error: idError } = await supabase
            .from('smart_links')
            .select(`
              *,
              platform_links (
                id,
                platform_id,
                platform_name,
                url
              ),
              profiles:user_id (
                hide_branding
              )
            `)
            .eq('id', slug)
            .maybeSingle();

          console.log("ID query result:", { data: idData, error: idError });

          if (idError) {
            console.error('Error fetching smart link by ID:', idError);
            throw idError;
          }

          if (!idData) {
            console.error('Smart link not found by either slug or ID:', slug);
            throw new Error('Smart link not found');
          }

          smartLinkData = idData;
        } else if (smartLinkError) {
          console.error('Error fetching smart link:', smartLinkError);
          throw smartLinkError;
        } else {
          smartLinkData = slugData;
        }

        if (!smartLinkData) {
          throw new Error('Smart link not found');
        }

        console.log("Successfully found smart link:", smartLinkData);
        return smartLinkData;
      } catch (error) {
        console.error("Error in smart link query:", error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  useEffect(() => {
    if (smartLink?.id) {
      recordViewMutation.mutate(smartLink.id);
      
      // Store the data globally for the crawler detection script
      window.smartLinkData = {
        title: smartLink.title,
        artistName: smartLink.artist_name,
        description: smartLink.description || '',
        artworkUrl: smartLink.artwork_url,
      };
      
      // Update meta tags and document title immediately for quicker crawler access
      const siteUrl = "https://soundraiser.io";
      const fullTitle = `${smartLink.title} by ${smartLink.artist_name} | Listen on All Platforms`;
      const description = smartLink.description || `Stream or download ${smartLink.title} by ${smartLink.artist_name}. Available on Spotify, Apple Music, and more streaming platforms.`;
      const canonical = `${siteUrl}/link/${slug}`;
      const artworkUrl = smartLink.artwork_url.startsWith('http') 
        ? smartLink.artwork_url 
        : `${siteUrl}${smartLink.artwork_url.startsWith('/') ? '' : '/'}${smartLink.artwork_url}`;
      
      // Set the document title immediately
      document.title = fullTitle;
      
      // Update meta tags with data attributes for crawler detection
      updateMetaTags(fullTitle, description, artworkUrl, canonical);
    }
  }, [smartLink?.id, slug]);
  
  // Function to update meta tags
  function updateMetaTags(title: string, description: string, image: string, url: string) {
    const metaTags = [
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:url', content: url },
      { property: 'og:type', content: 'music.song' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
      { name: 'description', content: description }
    ];
    
    // Update data-meta elements
    document.querySelectorAll('meta[data-meta]').forEach(meta => {
      const metaEl = meta as HTMLMetaElement;
      const type = metaEl.getAttribute('data-meta');
      
      switch (type) {
        case 'title':
        case 'twitter:title':
          metaEl.setAttribute('content', title);
          break;
        case 'description':
        case 'twitter:description':
          metaEl.setAttribute('content', description);
          break;
        case 'image':
        case 'twitter:image':
          metaEl.setAttribute('content', image);
          break;
        case 'url':
          metaEl.setAttribute('content', url);
          break;
        case 'type':
          metaEl.setAttribute('content', 'music.song');
          break;
      }
    });
    
    // Also update or create the direct meta tags
    metaTags.forEach(tag => {
      let meta;
      if (tag.property) {
        meta = document.querySelector(`meta[property="${tag.property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', tag.property);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', tag.content);
      } else if (tag.name) {
        meta = document.querySelector(`meta[name="${tag.name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', tag.name);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', tag.content);
      }
    });
    
    // Add a canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  }

  useEffect(() => {
    if (smartLink?.meta_pixel_id) {
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

  const handlePlatformClick = async (platformLinkId: string) => {
    if (!smartLink) return;

    try {
      console.log('Recording platform click for ID:', platformLinkId);
      
      analytics.trackPlatformClick(smartLink.platform_name || 'Unknown', smartLink.id);
      
      await analyticsService.trackPlatformClick(platformLinkId);
      console.log('Platform click recorded successfully');

      if (smartLink.meta_pixel_id) {
        fbq('track', smartLink.meta_click_event || 'SmartLinkClick');
      }
    } catch (error) {
      console.error('Error in handlePlatformClick:', error);
    }
  };

  if (isLoading) {
    console.log("Smart link is loading...");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-center mt-4 text-gray-600">Loading your music...</p>
        </div>
      </div>
    );
  }

  if (error || !smartLink) {
    console.error("Smart link error or not found:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl max-w-md w-full mx-4">
          <h1 className="text-2xl font-semibold text-center text-gray-900 mb-4">Link Not Found</h1>
          <p className="text-center text-gray-600">
            This link may have been removed or is temporarily unavailable.
          </p>
        </div>
      </div>
    );
  }

  const platformIcons: { [key: string]: string } = {
    spotify: "/lovable-uploads/spotify.png",
    apple_music: "/lovable-uploads/applemusic.png",
    youtube_music: "/lovable-uploads/youtubemusic.png",
    youtube: "/lovable-uploads/youtube.png",
    amazon_music: "/lovable-uploads/amazonmusic.png",
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
    youtubeMusic: "/lovable-uploads/youtubemusic.png",
    appleMusic: "/lovable-uploads/applemusic.png",
    amazonMusic: "/lovable-uploads/amazonmusic.png",
  };

  const getActionText = (platformId: string): string => {
    return ['itunes', 'beatport'].includes(platformId) ? 'Buy' : 'Play';
  };

  const streamingPlatforms = smartLink.platform_links?.map(pl => ({
    name: pl.platform_name,
    url: pl.url
  })) || [];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center">
      <SmartLinkSEO
        title={smartLink.title}
        artistName={smartLink.artist_name}
        artworkUrl={smartLink.artwork_url}
        description={smartLink.description}
        releaseDate={smartLink.release_date}
        streamingPlatforms={streamingPlatforms}
      />
      
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
            description={smartLink.description}
            contentType={smartLink.content_type}
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
                  name={platformLink.platform_name}
                  icon={icon}
                  action={getActionText(platformLink.platform_id)}
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
        
        {!smartLink.profiles?.hide_branding && (
          <div className="mt-8 text-center">
            <a 
              href="https://soundraiser.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-white/60 hover:text-white/80 transition-colors group"
            >
              <img 
                src="/lovable-uploads/soundraiser-logo/Iso D.svg"
                alt="Soundraiser"
                className="h-4 w-4 opacity-60 group-hover:opacity-80 transition-opacity"
              />
              <span className="text-sm">Powered by Soundraiser</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
