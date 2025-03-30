
export const DEFAULT_SEO_CONFIG = {
  title: "Soundraiser - Create Music Smart Links in Seconds",
  description: "Create smart links for your music in seconds. Share your songs across all streaming platforms with one link. The easiest way to promote your music online.",
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
  },
  mainEntity: {
    "@type": "SoftwareApplication",
    name: "Soundraiser",
    applicationCategory: "MusicApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "124"
    }
  },
  sameAs: [
    "https://twitter.com/soundraiser_",
    "https://www.instagram.com/soundraiser"
  ]
};
