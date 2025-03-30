
export const DEFAULT_SEO_CONFIG = {
  siteUrl: "https://soundraiser.io",
  twitterUsername: "@soundraiser_",
  defaultTitle: "Soundraiser - Smart Links for Musicians",
  defaultDescription: "Create beautiful smart links for your music on all platforms. Promote your releases effectively.",
  defaultImage: "/soundraiser-og-image.jpg",
}

export const SCHEMA_ORG_CONFIG = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Soundraiser",
  "url": "https://soundraiser.io",
  "logo": "https://soundraiser.io/lovable-uploads/soundraiser-logo/Logo A.png",
  "sameAs": [
    "https://twitter.com/soundraiser_",
    "https://www.instagram.com/soundraiser.io/"
  ],
  "description": "Soundraiser helps independent musicians create smart links and market their music effectively.",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "US"
  }
};
