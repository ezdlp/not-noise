
import { Helmet } from "react-helmet";
import { SEOProps } from "./types";
import { DEFAULT_SEO_CONFIG } from "./config";

export function PageSEO({
  title,
  description,
  canonical,
  image,
  type = "website",
  noindex = false,
  ogTitle,
  ogDescription,
  twitterTitle,
  twitterDescription,
}: SEOProps) {
  const fullTitle = `${title} | Soundraiser`;
  const finalCanonical = canonical || `${DEFAULT_SEO_CONFIG.siteUrl}${window.location.pathname}`;
  const finalImage = image || DEFAULT_SEO_CONFIG.image;

  return (
    <Helmet>
      {/* Basic */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={finalCanonical} />
      {noindex && <meta name="robots" content="noindex,follow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={ogTitle || fullTitle} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:url" content={finalCanonical} />
      <meta property="og:site_name" content="Soundraiser" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={twitterTitle || fullTitle} />
      <meta name="twitter:description" content={twitterDescription || description} />
      <meta name="twitter:image" content={finalImage} />
    </Helmet>
  );
}
