
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
  const defaultImage = "/soundraiser-og-image.jpg";
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
      
      {/* Technical SEO */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={seo.url} />
      <meta httpEquiv="content-language" content="en" />
      
      {/* Resource hints */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://i.scdn.co" crossOrigin="anonymous" />
      
      {/* Schema.org structured data */}
      <script type="application/ld+json">
        {JSON.stringify(SCHEMA_ORG_CONFIG)}
      </script>
    </Helmet>
  );
}
