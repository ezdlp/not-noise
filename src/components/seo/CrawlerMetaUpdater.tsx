import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * This component dynamically updates meta tags for both JavaScript-enabled
 * browsers and crawlers that don't execute JavaScript.
 * 
 * It works by:
 * 1. Checking if we're on a smart link route
 * 2. For browsers, it updates meta tags using DOM manipulation
 */
export function CrawlerMetaUpdater() {
  const location = useLocation();
  const isSmartLinkRoute = location.pathname.startsWith('/link/');
  
  useEffect(() => {
    if (!isSmartLinkRoute) return;
    
    // Get the slug from the URL
    const slug = location.pathname.split('/').pop();
    
    // For debugging: log that we're updating meta tags
    console.log(`CrawlerMetaUpdater: Updating meta tags for ${slug}`);
    
    // Get data from the page if possible
    const title = document.querySelector('h1')?.textContent || '';
    const artist = document.querySelector('.artist-name')?.textContent || '';
    const description = document.querySelector('.description')?.textContent || '';
    const image = document.querySelector('.artwork img')?.getAttribute('src') || '';
    
    // Check if there's data from our React components
    if (window.smartLinkData) {
      updateMetaTags(
        window.smartLinkData.title,
        window.smartLinkData.artistName,
        window.smartLinkData.description,
        window.smartLinkData.artworkUrl
      );
    } 
    // Otherwise use what we can find in the DOM
    else if (title && artist) {
      updateMetaTags(
        title,
        artist,
        description,
        image
      );
    }
  }, [location.pathname, isSmartLinkRoute]);
  
  /**
   * Updates the meta tags in the document head
   */
  const updateMetaTags = (title: string, artist: string, description: string, image: string) => {
    const fullTitle = `${title} by ${artist} | Listen on All Platforms`;
    const fullDescription = description || `Stream or download ${title} by ${artist}. Available on Spotify, Apple Music, and more streaming platforms.`;
    const fullUrl = window.location.href;
    
    // Update all meta tags with data-meta attribute
    document.querySelectorAll('meta[data-meta]').forEach(meta => {
      const metaEl = meta as HTMLMetaElement;
      const type = metaEl.getAttribute('data-meta');
      
      switch (type) {
        case 'title':
        case 'twitter:title':
          metaEl.setAttribute('content', fullTitle);
          break;
        case 'description':
        case 'twitter:description':
          metaEl.setAttribute('content', fullDescription);
          break;
        case 'image':
        case 'twitter:image':
          metaEl.setAttribute('content', image);
          break;
        case 'url':
          metaEl.setAttribute('content', fullUrl);
          break;
        case 'type':
          metaEl.setAttribute('content', 'music.song');
          break;
      }
    });
    
    // Update document title
    document.title = fullTitle;
  };
  
  // This component doesn't render anything visible
  return null;
}

// Add the global type for window
declare global {
  interface Window {
    smartLinkData?: {
      title: string;
      artistName: string;
      description: string;
      artworkUrl: string;
    };
  }
}
