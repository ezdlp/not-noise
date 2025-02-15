
import { Helmet } from "react-helmet";
import { useLocation } from "react-router-dom";
import { SCHEMA_ORG_CONFIG } from "./config";

interface Props {
  title?: string;
  description?: string;
  image?: string;
  article?: boolean;
}

export default function WebsiteSEO({
  title,
  description,
  image,
  article,
}: Props) {
  const { pathname } = useLocation();

  const defaultTitle = "Soundraiser";
  const defaultDescription = "Smart Links and Music Marketing Platform";
  const siteUrl = "https://soundraiser.io";
  const defaultImage = "/lovable-uploads/soundraiser-logo/Iso A.png";
  const twitterUsername = "@soundraiser_";

  const seo = {
    title: title || defaultTitle,
    description: description || defaultDescription,
    image: `${siteUrl}${image || defaultImage}`,
    url: `${siteUrl}${pathname}`,
  };

  return (
    <Helmet title={seo.title}>
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#6851FB" />
      <meta name="description" content={seo.description} />
      <meta name="image" content={seo.image} />
      
      {/* OG (Open Graph) tags */}
      {article ? (
        <meta property="og:type" content="article" />
      ) : (
        <meta property="og:type" content="website" />
      )}
      <meta property="og:url" content={seo.url} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={seo.image} />
      <meta property="og:image:alt" content={seo.description} />
      
      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content={twitterUsername} />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={seo.image} />
      <meta name="twitter:image:alt" content={seo.description} />

      {/* Schema.org structured data */}
      <script type="application/ld+json">
        {JSON.stringify(SCHEMA_ORG_CONFIG)}
      </script>
    </Helmet>
  );
}
