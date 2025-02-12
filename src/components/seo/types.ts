
export interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article' | 'music.song';
  published?: string;
  modified?: string;
  noindex?: boolean;
  // Open Graph specific
  ogTitle?: string;
  ogDescription?: string;
  // Twitter specific
  twitterTitle?: string;
  twitterDescription?: string;
}
