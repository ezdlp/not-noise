
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
}

export function SmartLinkSEO({
  title,
  artistName,
  artworkUrl,
  description,
  releaseDate,
  streamingPlatforms = [],
}: SmartLinkSEOProps) {
  const siteUrl = "https://soundraiser.io";
  const fullTitle = `${title} by ${artistName} | Listen on All Platforms`;
  const finalDescription = description || `Stream or download ${title} by ${artistName}. Available on Spotify, Apple Music, and more streaming platforms.`;
  const canonical = `${siteUrl}${window.location.pathname}`;
  
  // Make sure artwork URL is absolute
  const absoluteArtworkUrl = artworkUrl.startsWith('http') 
    ? artworkUrl 
    : `${siteUrl}${artworkUrl.startsWith('/') ? '' : '/'}${artworkUrl}`;

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
      "@id": `${siteUrl}/artist/${encodeURIComponent(artistName)}`
    },
    "image": absoluteArtworkUrl,
    "description": description,
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
        "url": `${siteUrl}/lovable-uploads/soundraiser-logo/Logo A.png`
      }
    }
  };
  
  // Update any global data or other state
  useEffect(() => {
    // Store the smartLinkData globally for crawler detection
    window.smartLinkData = {
      title,
      artistName,
      description: finalDescription,
      artworkUrl: absoluteArtworkUrl,
    };
    
    // Force update meta tags right away (in addition to Helmet)
    const updateMetaTags = () => {
      const metaTags = [
        { property: 'og:title', content: fullTitle },
        { property: 'og:description', content: finalDescription },
        { property: 'og:image', content: absoluteArtworkUrl },
        { property: 'og:url', content: canonical },
        { property: 'og:type', content: 'music.song' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: fullTitle },
        { name: 'twitter:description', content: finalDescription },
        { name: 'twitter:image', content: absoluteArtworkUrl },
        { name: 'description', content: finalDescription }
      ];
      
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
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', canonical);
      
      // Update structured data
      let structuredData = document.querySelector('script[type="application/ld+json"]');
      if (!structuredData) {
        structuredData = document.createElement('script');
        structuredData.setAttribute('type', 'application/ld+json');
        document.head.appendChild(structuredData);
      }
      structuredData.textContent = JSON.stringify(musicSchema);
    };
    
    // Run immediately
    updateMetaTags();
    // Also delay by a small amount to ensure it runs after any other scripts
    setTimeout(updateMetaTags, 100);
  }, [title, artistName, description, absoluteArtworkUrl, canonical, fullTitle, finalDescription]);

  return (
    <Helmet>
      {/* Basic */}
      <title>{fullTitle}</title>
      <meta name="description" content={finalDescription} />
      <link rel="canonical" href={canonical} />
      
      {/* Technical SEO */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5" />
      <meta name="robots" content="index, follow" />
      <meta httpEquiv="content-language" content="en" />
      
      {/* OG (Open Graph) tags */}
      <meta property="og:type" content="music.song" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={absoluteArtworkUrl} />
      <meta property="og:site_name" content="Soundraiser" />
      {releaseDate && <meta property="music:release_date" content={releaseDate} />}
      {streamingPlatforms.map((platform, index) => (
        <meta key={index} property="music:musician" content={platform.url} />
      ))}

      {/* Image dimensions for social media */}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />
      
      {/* WhatsApp specific */}
      <meta property="og:image:secure_url" content={absoluteArtworkUrl} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={absoluteArtworkUrl} />

      {/* Schema.org structured data */}
      <script type="application/ld+json">
        {JSON.stringify(musicSchema)}
      </script>
    </Helmet>
  );
}
