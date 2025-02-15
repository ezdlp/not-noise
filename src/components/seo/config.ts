
export const DEFAULT_SEO_CONFIG = {
  title: "Soundraiser - Music Marketing Made Simple",
  description: "Create smart links, track performance, and grow your audience with powerful music marketing tools. The all-in-one platform for musicians and labels.",
  image: "/lovable-uploads/soundraiser-logo/Logo A.svg",
  type: "website" as const,
  siteUrl: "https://soundraiser.io",
};

export const SCHEMA_ORG_CONFIG = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Soundraiser",
  url: "https://soundraiser.io",
  description: "Smart Links and Music Marketing Platform",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://soundraiser.io/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  },
  publisher: {
    "@type": "Organization",
    name: "Soundraiser",
    logo: {
      "@type": "ImageObject",
      url: "https://soundraiser.io/lovable-uploads/soundraiser-logo/Logo A.svg"
    }
  }
};
