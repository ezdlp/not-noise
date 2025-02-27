
import React from 'react';
import { Helmet } from 'react-helmet';
import WebsiteSEO from './WebsiteSEO';

interface BlogSEOProps {
  currentPage: number;
  totalPages: number;
}

export const BlogSEO: React.FC<BlogSEOProps> = ({ currentPage, totalPages }) => {
  const baseTitle = "Blog | Soundraiser";
  const pageTitle = currentPage > 1 ? `${baseTitle} - Page ${currentPage}` : baseTitle;
  const canonicalUrl = currentPage > 1 
    ? `https://soundraiser.io/blog/page/${currentPage}` 
    : 'https://soundraiser.io/blog';
  
  // Generate prev/next links for pagination
  const prevLink = currentPage > 1 
    ? (currentPage === 2 ? 'https://soundraiser.io/blog' : `https://soundraiser.io/blog/page/${currentPage - 1}`)
    : null;
  
  const nextLink = currentPage < totalPages 
    ? `https://soundraiser.io/blog/page/${currentPage + 1}` 
    : null;

  return (
    <>
      <WebsiteSEO 
        title={pageTitle}
        description="Read the latest music marketing tips, industry trends, and resources for independent musicians."
        canonicalUrl={canonicalUrl}
        ogType="website"
      />
      <Helmet>
        {prevLink && <link rel="prev" href={prevLink} />}
        {nextLink && <link rel="next" href={nextLink} />}
        {currentPage > 1 && <meta name="robots" content="noindex, follow" />}
      </Helmet>
    </>
  );
};
