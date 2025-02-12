
import { Helmet } from "react-helmet";
import { DEFAULT_SEO_CONFIG } from "./config";

interface ArticleSEOProps {
  title: string;
  description: string;
  image?: string;
  author: {
    name: string;
    url?: string;
  };
  publishedAt: string;
  modifiedAt?: string;
  categories?: string[];
  tags?: string[];
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
}

export function ArticleSEO({
  title,
  description,
  image,
  author,
  publishedAt,
  modifiedAt,
  categories = [],
  tags = [],
  ogTitle,
  ogDescription,
  twitterTitle,
  twitterDescription,
}: ArticleSEOProps) {
  const fullTitle = `${title} | ${DEFAULT_SEO_CONFIG.title}`;
  const canonicalUrl = `${DEFAULT_SEO_CONFIG.siteUrl}${window.location.pathname}`;
  const finalImage = image || DEFAULT_SEO_CONFIG.image;

  // Prepare schema.org Article markup
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    image: finalImage,
    author: {
      "@type": "Person",
      name: author.name,
      url: author.url,
    },
    publisher: {
      "@type": "Organization",
      name: "Soundraiser",
      logo: {
        "@type": "ImageObject",
        url: `${DEFAULT_SEO_CONFIG.siteUrl}/logo.png`,
      },
    },
    datePublished: publishedAt,
    dateModified: modifiedAt || publishedAt,
    description: description,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    keywords: tags.join(", "),
  };

  // Prepare BreadcrumbList schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Blog",
        item: `${DEFAULT_SEO_CONFIG.siteUrl}/blog`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: title,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <Helmet>
      {/* Basic */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Article-specific meta tags */}
      <meta property="article:published_time" content={publishedAt} />
      {modifiedAt && <meta property="article:modified_time" content={modifiedAt} />}
      {categories.map((category) => (
        <meta key={category} property="article:section" content={category} />
      ))}
      {tags.map((tag) => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* Open Graph */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={ogTitle || fullTitle} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="Soundraiser" />
      <meta property="article:author" content={author.name} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={twitterTitle || ogTitle || fullTitle} />
      <meta
        name="twitter:description"
        content={twitterDescription || ogDescription || description}
      />
      <meta name="twitter:image" content={finalImage} />

      {/* Schema.org structured data */}
      <script type="application/ld+json">
        {JSON.stringify(articleSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
    </Helmet>
  );
}
