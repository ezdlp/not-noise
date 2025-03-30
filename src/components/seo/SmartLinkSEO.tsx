
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
    : `${DEFAULT_SEO_CONFIG.siteUrl}${artworkUrl}`;

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

  // Direct DOM manipulation for consistent metadata for crawlers
  useEffect(() => {
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
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Update the document title directly
    document.title = fullTitle;
    
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
    
    // Special link for alternate bot view
    if (slug) {
      let link = document.querySelector('link[data-bot-view="true"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'alternate');
        link.setAttribute('type', 'text/html');
        link.setAttribute('data-bot-view', 'true');
        document.head.appendChild(link);
      }
      link.setAttribute('href', `${DEFAULT_SEO_CONFIG.siteUrl}/og/link/${slug}`);
      
      setMetaTag('og:see_also', `${DEFAULT_SEO_CONFIG.siteUrl}/og/link/${slug}`, 'og:see_also');
    }
    
    // Manual cleanup when component unmounts
    return () => {
      // We don't remove the meta tags on unmount as they should persist
      // for better SEO even during page transitions
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
      <meta name="description" content={finalDescription} />
      <link rel="canonical" href={canonical} />
      
      {/* Essential Open Graph - Required properties */}
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="music.song" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={absoluteArtworkUrl} />
      <meta property="og:site_name" content="Soundraiser" />
      
      {/* Facebook specific */}
      <meta property="fb:app_id" content="1032091254648768" />
      
      {/* Image dimensions for social media */}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={absoluteArtworkUrl} />
      
      {/* Music specific */}
      {releaseDate && <meta property="music:release_date" content={releaseDate} />}
      {streamingPlatforms.map((platform, index) => (
        <meta key={index} property="music:musician" content={platform.url} />
      ))}

      {/* Schema.org structured data */}
      <script type="application/ld+json">
        {JSON.stringify(musicSchema)}
      </script>
    </Helmet>
  );
}
