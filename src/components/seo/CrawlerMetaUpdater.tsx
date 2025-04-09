
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * This component dynamically updates meta tags for both JavaScript-enabled
 * browsers and crawlers that don't execute JavaScript.
 * 
 * It works by:
 * 1. Checking if we're on a smart link route
 * 2. For browsers, it updates meta tags using DOM manipulation
 * 3. For crawlers, it monitors meta tag changes and ensures they are populated
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
    
    const siteUrl = "https://soundraiser.io";
    
    // Check if there's data from our React components
    if (window.smartLinkData) {
      updateMetaTags(
        window.smartLinkData.title,
        window.smartLinkData.artistName,
        window.smartLinkData.description,
        window.smartLinkData.artworkUrl,
        `${siteUrl}/link/${slug}`
      );
    } else {
      // As a fallback, try to use a fetch request to get the meta data
      const fetchMetaData = async () => {
        try {
          // Use the Edge Function directly with the correct project URL
          const supabaseProjectId = 'owtufhdsuuyrgmxytclj';
          const functionUrl = `https://${supabaseProjectId}.supabase.co/functions/v1/smart-link-meta?slug=${slug}`;
          
          const response = await fetch(functionUrl);
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.title) {
              updateMetaTags(
                data.title,
                data.artistName,
                data.description,
                data.artworkUrl,
                `${siteUrl}/link/${slug}`
              );
            } else {
              console.warn("Smart link meta data missing required fields:", data);
            }
          } else {
            console.error(`Error fetching meta data: ${response.status} ${response.statusText}`);
          }
        } catch (error) {
          console.error('Error fetching meta data:', error);
        }
      };
      
      fetchMetaData();
    }
    
    // Fallback: use content from the DOM if React data isn't available
    setTimeout(() => {
      if (!document.querySelector('meta[property="og:title"]')?.getAttribute('content')?.includes(' by ')) {
        const title = document.querySelector('h1')?.textContent || '';
        const artist = document.querySelector('.artist-name')?.textContent || '';
        const description = document.querySelector('.description')?.textContent || '';
        const image = document.querySelector('.artwork img')?.getAttribute('src') || '';
        
        if (title && artist) {
          updateMetaTags(
            title,
            artist,
            description,
            image,
            `${siteUrl}/link/${slug}`
          );
        }
      }
    }, 1000);
  }, [location.pathname, isSmartLinkRoute]);
  
  /**
   * Updates the meta tags in the document head
   */
  const updateMetaTags = (title: string, artist: string, description: string, image: string, url: string) => {
    const fullTitle = `${title} by ${artist} | Listen on All Platforms`;
    const fullDescription = description || `Stream or download ${title} by ${artist}. Available on Spotify, Apple Music, and more streaming platforms.`;
    
    // Make sure image URL is absolute
    const siteUrl = "https://soundraiser.io";
    const absoluteImageUrl = image.startsWith('http') 
      ? image 
      : `${siteUrl}${image.startsWith('/') ? '' : '/'}${image}`;
    
    // First update data-meta attributes
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
          metaEl.setAttribute('content', absoluteImageUrl);
          break;
        case 'url':
          metaEl.setAttribute('content', url);
          break;
        case 'type':
          metaEl.setAttribute('content', 'music.song');
          break;
      }
    });
    
    // Then update standard meta tags
    const standardMetaTags = [
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: fullDescription },
      { property: 'og:image', content: absoluteImageUrl },
      { property: 'og:url', content: url },
      { property: 'og:type', content: 'music.song' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: fullTitle },
      { property: 'og:image:secure_url', content: absoluteImageUrl },
      { property: 'og:locale', content: 'en_US' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: fullDescription },
      { name: 'twitter:image', content: absoluteImageUrl },
      { name: 'description', content: fullDescription }
    ];
    
    // Update or create the meta tags
    standardMetaTags.forEach(tag => {
      let meta;
      if (tag.property) {
        meta = document.querySelector(`meta[property="${tag.property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', tag.property);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', tag.content);
      } else if (tag.name) {
        meta = document.querySelector(`meta[name="${tag.name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', tag.name);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', tag.content);
      }
    });
    
    // Set canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
    
    // Update document title
    document.title = fullTitle;
    
    console.log('Meta tags updated with:', {
      title: fullTitle,
      description: fullDescription,
      image: absoluteImageUrl,
      url: url
    });
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
