
import { Helmet } from "react-helmet";
import { DEFAULT_SEO_CONFIG } from "./config";
import { useEffect } from "react";

interface SmartLinkSEOProps {
  title: string;
  artistName: string;
  artworkUrl: string;
  description?: string;
  releaseDate?: string;
  streamingPlatforms?: {
    name: string;
    url: string;
  }[];
  slug?: string;
}

export function SmartLinkSEO({
  title,
  artistName,
  artworkUrl,
  description,
  releaseDate,
  streamingPlatforms = [],
  slug,
}: SmartLinkSEOProps) {
  const fullTitle = `${title} by ${artistName} | Listen on All Platforms`;
  const finalDescription = description || `Stream or download ${title} by ${artistName}. Available on Spotify, Apple Music, and more streaming platforms.`;
  
  // Use the explicit slug for canonical URL if available, otherwise fallback to window.location
  const pathname = slug ? `/link/${slug}` : window.location.pathname;
  const canonical = `${DEFAULT_SEO_CONFIG.siteUrl}${pathname}`;
  
  // Make sure we have an absolute URL for the artwork
  const absoluteArtworkUrl = artworkUrl.startsWith('http') 
    ? artworkUrl 
    : `${DEFAULT_SEO_CONFIG.siteUrl}${artworkUrl.startsWith('/') ? '' : '/'}${artworkUrl}`;

  // Generate action buttons for schema markup
  const actionButtons = streamingPlatforms.map(platform => ({
    "@type": "ListenAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": platform.url,
      "actionPlatform": [
        "http://schema.org/MusicPlatform",
        platform.url
      ]
    },
    "expectsAcceptanceOf": {
      "@type": "Offer",
      "category": "stream"
    }
  }));

  // Enhanced MusicRecording schema
  const musicSchema = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    "name": title,
    "byArtist": {
      "@type": "MusicGroup",
      "name": artistName,
      "@id": `${DEFAULT_SEO_CONFIG.siteUrl}/artist/${encodeURIComponent(artistName)}`
    },
    "image": absoluteArtworkUrl,
    "description": finalDescription,
    ...(releaseDate && { "datePublished": releaseDate }),
    "potentialAction": actionButtons,
    "url": canonical,
    "offers": streamingPlatforms.map(platform => ({
      "@type": "Offer",
      "url": platform.url,
      "availability": "https://schema.org/InStock",
      "category": "stream"
    })),
    "publisher": {
      "@type": "Organization",
      "name": "Soundraiser",
      "logo": {
        "@type": "ImageObject",
        "url": `${DEFAULT_SEO_CONFIG.siteUrl}/lovable-uploads/soundraiser-logo/Logo A.png`
      }
    }
  };

  // This function detects if the current user agent is likely a bot
  const isSocialBot = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    return /bot|crawler|spider|facebookexternalhit|twitterbot|discordbot|telegrambot|whatsapp|linkedinbot|slack/i.test(userAgent);
  };

  // Direct DOM manipulation for consistent metadata for crawlers
  useEffect(() => {
    // First, clean up existing homepage-specific meta tags
    document.querySelectorAll('meta[data-homepage="true"]').forEach(tag => {
      tag.remove();
    });
    
    // Debug information in console
    console.log(`SmartLinkSEO: Setting metadata for ${title} by ${artistName}`);
    console.log(`SmartLinkSEO: Artwork URL: ${absoluteArtworkUrl}`);
    console.log(`SmartLinkSEO: Is social bot: ${isSocialBot()}`);
    
    // Don't modify DOM if this appears to be a bot - they should get server-rendered markup
    if (isSocialBot()) {
      console.log('SmartLinkSEO: Social bot detected, not modifying client-side meta tags');
      return;
    }
    
    // Helper to create or update meta tags
    const setMetaTag = (name: string, content: string, property?: string) => {
      // Try to find existing tag first
      let meta;
      if (property) {
        meta = document.querySelector(`meta[property="${property}"]`);
      } else {
        meta = document.querySelector(`meta[name="${name}"]`);
      }
      
      // Create or update the tag
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', name);
        }
        meta.setAttribute('data-smart-link', 'true');
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Update the document title directly
    document.title = fullTitle;
    
    // Add debugging meta tag
    setMetaTag('x-soundraiser-client-debug', `smart-link-seo-${Date.now()}`, 'x-soundraiser-client-debug');
    
    // Update basic meta tags
    setMetaTag('description', finalDescription);
    
    // Update OpenGraph meta tags
    setMetaTag('og:type', 'music.song', 'og:type');
    setMetaTag('og:title', fullTitle, 'og:title');
    setMetaTag('og:description', finalDescription, 'og:description');
    setMetaTag('og:image', absoluteArtworkUrl, 'og:image');
    setMetaTag('og:url', canonical, 'og:url');
    setMetaTag('og:site_name', 'Soundraiser', 'og:site_name');
    setMetaTag('og:image:width', '1200', 'og:image:width');
    setMetaTag('og:image:height', '630', 'og:image:height');
    
    // Twitter meta tags
    setMetaTag('twitter:card', 'summary_large_image', 'twitter:card');
    setMetaTag('twitter:title', fullTitle, 'twitter:title');
    setMetaTag('twitter:description', finalDescription, 'twitter:description');
    setMetaTag('twitter:image', absoluteArtworkUrl, 'twitter:image');
    setMetaTag('twitter:domain', DEFAULT_SEO_CONFIG.siteUrl.replace(/^https?:\/\//, ''), 'twitter:domain');
    
    // Music meta tags
    if (releaseDate) {
      setMetaTag('music:release_date', releaseDate, 'music:release_date');
    }
    
    // Remove existing platform links to avoid duplicates
    document.querySelectorAll('meta[property="music:musician"]').forEach(tag => tag.remove());
    
    // Add platform links
    streamingPlatforms.forEach(platform => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'music:musician');
      meta.setAttribute('content', platform.url);
      meta.setAttribute('data-smart-link', 'true');
      document.head.appendChild(meta);
    });
    
    // Update schema.org JSON-LD
    let script = document.querySelector('script[type="application/ld+json"]');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(musicSchema);
    
    // Special links for alternate bot view and debugging
    if (slug) {
      // Social media preview direct link
      let linkSocial = document.querySelector('link[data-bot-view="true"]');
      if (!linkSocial) {
        linkSocial = document.createElement('link');
        linkSocial.setAttribute('rel', 'alternate');
        linkSocial.setAttribute('type', 'text/html');
        linkSocial.setAttribute('data-bot-view', 'true');
        document.head.appendChild(linkSocial);
      }
      linkSocial.setAttribute('href', `${DEFAULT_SEO_CONFIG.siteUrl}/og/link/${slug}`);
      
      // Add a meta tag for social media crawlers to see the direct OG link
      setMetaTag('og:see_also', `${DEFAULT_SEO_CONFIG.siteUrl}/og/link/${slug}`, 'og:see_also');
      
      // Add a special debug header to help track the source
      const metaDebug = document.createElement('meta');
      metaDebug.setAttribute('name', 'x-soundraiser-debug');
      metaDebug.setAttribute('content', `smart-link:${slug}:client-side`);
      document.head.appendChild(metaDebug);
    }
    
    // Manual cleanup when component unmounts
    return () => {
      // Clean up all meta tags we've added for this smart link
      document.querySelectorAll('meta[data-smart-link="true"]').forEach(tag => {
        tag.remove();
      });
    };
  }, [
    fullTitle, 
    finalDescription, 
    absoluteArtworkUrl, 
    canonical, 
    releaseDate, 
    slug, 
    streamingPlatforms, 
    musicSchema
  ]);

  // We still use Helmet as a fallback for non-crawler browsers
  return (
    <Helmet>
      {/* Basic */}
      <title>{fullTitle}</title>
      <meta name="description" content={finalDescription} data-smart-link="true" />
      <link rel="canonical" href={canonical} data-smart-link="true" />
      
      {/* Essential Open Graph - Required properties */}
      <meta property="og:url" content={canonical} data-smart-link="true" />
      <meta property="og:type" content="music.song" data-smart-link="true" />
      <meta property="og:title" content={fullTitle} data-smart-link="true" />
      <meta property="og:description" content={finalDescription} data-smart-link="true" />
      <meta property="og:image" content={absoluteArtworkUrl} data-smart-link="true" />
      <meta property="og:site_name" content="Soundraiser" data-smart-link="true" />
      
      {/* Facebook specific */}
      <meta property="fb:app_id" content="1032091254648768" data-smart-link="true" />
      
      {/* Image dimensions for social media */}
      <meta property="og:image:width" content="1200" data-smart-link="true" />
      <meta property="og:image:height" content="630" data-smart-link="true" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" data-smart-link="true" />
      <meta name="twitter:title" content={fullTitle} data-smart-link="true" />
      <meta name="twitter:description" content={finalDescription} data-smart-link="true" />
      <meta name="twitter:image" content={absoluteArtworkUrl} data-smart-link="true" />
      
      {/* Music specific */}
      {releaseDate && <meta property="music:release_date" content={releaseDate} data-smart-link="true" />}
      {streamingPlatforms.map((platform, index) => (
        <meta key={index} property="music:musician" content={platform.url} data-smart-link="true" />
      ))}

      {/* Alternative bot-friendly URL */}
      {slug && <link rel="alternate" href={`${DEFAULT_SEO_CONFIG.siteUrl}/og/link/${slug}`} data-bot-view="true" />}
      {slug && <meta property="og:see_also" content={`${DEFAULT_SEO_CONFIG.siteUrl}/og/link/${slug}`} data-smart-link="true" />}

      {/* Schema.org structured data */}
      <script type="application/ld+json">
        {JSON.stringify(musicSchema)}
      </script>
    </Helmet>
  );
}
