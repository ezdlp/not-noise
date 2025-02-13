
import { Helmet } from "react-helmet";
import { DEFAULT_SEO_CONFIG } from "./config";

export function WebsiteSEO() {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Soundraiser",
    url: DEFAULT_SEO_CONFIG.siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${DEFAULT_SEO_CONFIG.siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    },
    publisher: {
      "@type": "Organization",
      name: "Soundraiser",
      logo: {
        "@type": "ImageObject",
        url: `${DEFAULT_SEO_CONFIG.siteUrl}/lovable-uploads/soundraiser-logo/Logo A.svg`
      }
    }
  };

  return (
    <Helmet>
      {/* Technical SEO */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="en" />
      <meta name="language" content="English" />
      
      {/* Resource hints */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      
      {/* Schema.org markup */}
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
    </Helmet>
  );
}
