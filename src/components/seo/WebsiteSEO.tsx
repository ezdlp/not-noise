import { Helmet } from "react-helmet";
import { useLocation } from "@reach/router";
import { useStaticQuery, graphql } from "gatsby";

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
  const { site } = useStaticQuery(query);

  const {
    defaultTitle,
    defaultDescription,
    siteUrl,
    defaultImage,
    twitterUsername,
  } = site?.siteMetadata;

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
    </Helmet>
  );
}

const query = graphql`
  query SEO {
    site {
      siteMetadata {
        defaultTitle: title
        defaultDescription: description
        siteUrl
        defaultImage: image
        twitterUsername
      }
    }
  }
`;
