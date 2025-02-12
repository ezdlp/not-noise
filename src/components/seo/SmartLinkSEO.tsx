
import { Helmet } from "react-helmet";
import { DEFAULT_SEO_CONFIG } from "./config";

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
  const fullTitle = `${title} by ${artistName} | Listen on All Platforms`;
  const finalDescription = description || `Stream or download ${title} by ${artistName}. Available on Spotify, Apple Music, and more streaming platforms.`;
  const canonical = `${DEFAULT_SEO_CONFIG.siteUrl}${window.location.pathname}`;

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

  return (
    <Helmet>
      {/* Basic */}
      <title>{fullTitle}</title>
      <meta name="description" content={finalDescription} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph Music */}
      <meta property="og:type" content="music.song" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={artworkUrl} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content="Soundraiser" />
      {releaseDate && <meta property="music:release_date" content={releaseDate} />}
      {streamingPlatforms.map((platform, index) => (
        <meta key={index} property="music:musician" content={platform.url} />
      ))}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={artworkUrl} />

      {/* Music-specific Schema.org structured data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "MusicRecording",
          "name": title,
          "byArtist": {
            "@type": "MusicGroup",
            "name": artistName
          },
          "image": artworkUrl,
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
        })}
      </script>
    </Helmet>
  );
}
