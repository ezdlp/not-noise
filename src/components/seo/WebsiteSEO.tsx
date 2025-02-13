
import { Helmet } from "react-helmet";
import { DEFAULT_SEO_CONFIG } from "./config";

// Define FAQ type for better type safety
type FAQItem = {
  question: string;
  answer: string;
};

export function WebsiteSEO() {
  // FAQ data from our FAQ component
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What makes Soundraiser's Smart Links special?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our Smart Links combine powerful marketing tools with beautiful, customizable designs. They feature Meta Pixel integration for retargeting, email capture, detailed analytics, and automatic social media card generation - all while maintaining a sleek, professional look that matches your brand."
        }
      },
      {
        "@type": "Question",
        "name": "How can I promote my music effectively using Smart Links?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our Smart Links offer multiple promotion tools: automatically generated social media cards for platforms like Instagram and TikTok, built-in Meta Pixel for retargeting campaigns, email capture for building your fan base, and detailed analytics to understand your audience's behavior across all streaming platforms."
        }
      },
      {
        "@type": "Question",
        "name": "What analytics and insights do I get?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You get comprehensive analytics including real-time views, clicks, geographic data, device types, platform preferences, and conversion rates. Our dashboard shows you detailed performance metrics, helping you understand where your fans are coming from and how they interact with your music."
        }
      },
      {
        "@type": "Question",
        "name": "How do the social media features work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our platform automatically generates eye-catching social cards for your music, optimized for Instagram, X (Twitter), TikTok, Facebook, and Snapchat. These visually appealing cards help your links stand out in social media feeds, increasing engagement and click-through rates."
        }
      }
    ]
  };

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
      <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0" />
      <meta httpEquiv="Content-Language" content="en" />
      <meta name="language" content="English" />
      
      {/* Resource hints */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
      
      {/* Image optimization */}
      <meta name="image-rendering" content="optimizeQuality" />
      
      {/* Social media image dimensions */}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content="image/png" />
      <meta name="twitter:card" content="summary_large_image" />
      
      {/* Schema.org markup */}
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>
    </Helmet>
  );
}
