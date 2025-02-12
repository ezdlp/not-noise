
import { Helmet } from "react-helmet";
import { DEFAULT_SEO_CONFIG } from "./config";

interface BlogSEOProps {
  currentPage?: number;
  totalPages?: number;
}

export function BlogSEO({ currentPage, totalPages }: BlogSEOProps) {
  const canonicalUrl = `${DEFAULT_SEO_CONFIG.siteUrl}/blog`;
  const title = "Blog | Soundraiser";
  const description = "Explore music marketing tips, industry insights, and success stories from artists using Soundraiser.";

  // Prepare CollectionPage schema
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    headline: "Soundraiser Blog",
    description: description,
    publisher: {
      "@type": "Organization",
      name: "Soundraiser",
      logo: {
        "@type": "ImageObject",
        url: `${DEFAULT_SEO_CONFIG.siteUrl}/logo.png`,
      },
    },
    url: canonicalUrl,
  };

  return (
    <Helmet>
      {/* Basic */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Pagination meta tags */}
      {currentPage && totalPages && currentPage > 1 && (
        <>
          <link
            rel="prev"
            href={`${canonicalUrl}${currentPage > 2 ? `/page/${currentPage - 1}` : ""}`}
          />
          {currentPage < totalPages && (
            <link
              rel="next"
              href={`${canonicalUrl}/page/${currentPage + 1}`}
            />
          )}
        </>
      )}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="Soundraiser" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />

      {/* Schema.org structured data */}
      <script type="application/ld+json">
        {JSON.stringify(collectionSchema)}
      </script>
    </Helmet>
  );
}
