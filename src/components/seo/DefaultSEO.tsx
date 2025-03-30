import { Helmet } from "react-helmet";
import { DEFAULT_SEO_CONFIG } from "./config";

export function DefaultSEO() {
  return (
    <Helmet>
      {/* Basic */}
      <title>{DEFAULT_SEO_CONFIG.defaultTitle}</title>
      <meta name="description" content={DEFAULT_SEO_CONFIG.defaultDescription} />
      <link rel="canonical" href={DEFAULT_SEO_CONFIG.siteUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={DEFAULT_SEO_CONFIG.type} />
      <meta property="og:title" content={DEFAULT_SEO_CONFIG.defaultTitle} />
      <meta property="og:description" content={DEFAULT_SEO_CONFIG.defaultDescription} />
      <meta property="og:image" content={DEFAULT_SEO_CONFIG.defaultImage} />
      <meta property="og:url" content={DEFAULT_SEO_CONFIG.siteUrl} />
      <meta property="og:site_name" content="Soundraiser" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={DEFAULT_SEO_CONFIG.defaultTitle} />
      <meta name="twitter:description" content={DEFAULT_SEO_CONFIG.defaultDescription} />
      <meta name="twitter:image" content={DEFAULT_SEO_CONFIG.defaultImage} />

      {/* Other Important Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="robots" content="index,follow" />
    </Helmet>
  );
}
