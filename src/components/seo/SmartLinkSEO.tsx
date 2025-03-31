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

  // Add debugging for bot detection
  useEffect(() => {
    const isBot = typeof navigator !== 'undefined' && /bot|crawler|spider|pinterest|facebook|twitter|linkedin/i.test(navigator.userAgent);
    console.log("SmartLinkSEO rendered:", {
      title: fullTitle,
      isBot,
      userAgent: navigator?.userAgent,
      slug
    });
  }, [fullTitle, slug]);

  return (
    <Helmet
      defaultTitle={fullTitle}
      titleTemplate={null}
    >
      {/* Basic */}
      <title>{fullTitle}</title>
      <meta name="description" content={finalDescription} />
      <link rel="canonical" href={canonical} />
      
      {/* Open Graph */}
      <meta property="og:type" content="music.song" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={absoluteArtworkUrl} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content="Soundraiser" />
      
      {/* Facebook Specific */}
      <meta property="fb:app_id" content="1032091254648768" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={absoluteArtworkUrl} />
      
      {/* Music Specific */}
      <meta property="music:musician" content={artistName} />
      <meta property="music:creator" content={artistName} />
      <meta property="music:musician:url" content={`${DEFAULT_SEO_CONFIG.siteUrl}/artist/${encodeURIComponent(artistName)}`} />
      {releaseDate && <meta property="music:release_date" content={releaseDate} />}
      
      {/* Image dimensions for social media */}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="1200" />
      
      {/* Debug Information */}
      <meta name="x-soundraiser-debug" content={`smart-link:${slug}:client-side`} />
      <meta name="x-soundraiser-url" content={canonical} />
      
      {/* Schema.org structured data */}
      <script type="application/ld+json">
        {JSON.stringify(musicSchema)}
      </script>
    </Helmet>
  );
}
