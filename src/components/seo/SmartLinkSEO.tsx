
import { Helmet } from "react-helmet";
import { DEFAULT_SEO_CONFIG } from "./config";

interface SmartLinkSEOProps {
  title: string;
  artistName: string;
  artworkUrl: string;
  description?: string;
  releaseDate?: string;
}

export function SmartLinkSEO({
  title,
  artistName,
  artworkUrl,
  description,
  releaseDate,
}: SmartLinkSEOProps) {
  const fullTitle = `${title} by ${artistName} | Listen on All Platforms`;
  const finalDescription = description || `Stream or download ${title} by ${artistName}. Available on Spotify, Apple Music, and more streaming platforms.`;
  const canonical = `${DEFAULT_SEO_CONFIG.siteUrl}${window.location.pathname}`;

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
          ...(releaseDate && { "datePublished": releaseDate }),
          "image": artworkUrl
        })}
      </script>
    </Helmet>
  );
}
