
/**
 * This script runs immediately to detect crawler user agents
 * and update meta tags accordingly if the URL is a smart link
 */
(function() {
  console.log('Crawler detector running...');
  
  // First check if we're on a smart link path
  const path = window.location.pathname;
  if (!path.startsWith('/link/')) {
    console.log('Not a smart link path, skipping crawler detection');
    return;
  }
  
  const slug = path.split('/').pop();
  if (!slug) {
    console.log('No slug found in path, skipping crawler detection');
    return;
  }
  
  console.log(`Smart link path detected: ${path}, Slug: ${slug}`);
  
  // List of known crawler user agents
  const crawlerPatterns = [
    /facebook/i,
    /facebookexternalhit/i,
    /fbbot/i,
    /FB_IAB/i,
    /instagram/i,
    /LinkedInBot/i,
    /pinterest/i,
    /twitter/i,
    /twitterbot/i, 
    /telegram/i,
    /google/i,
    /bot/i,
    /crawler/i,
    /spider/i,
    /yandex/i,
    /bingbot/i,
    /mediapartners-google/i,
    /whatsapp/i
  ];
  
  const userAgent = navigator.userAgent;
  console.log('User agent:', userAgent);
  
  // Check if the current user agent matches any crawler pattern
  const isCrawler = crawlerPatterns.some(pattern => pattern.test(userAgent));
  
  // Immediately try to fetch meta data for this link
  const siteUrl = "https://soundraiser.io";
  const metaUrl = `https://owtufhdsuuyrgmxytclj.supabase.co/functions/v1/smart-link-meta/${slug}`;
  
  console.log('Fetching meta data from:', metaUrl);
  
  // Use fetch API to get the meta data
  fetch(metaUrl)
    .then(response => {
      console.log('Meta response status:', response.status);
      if (!response.ok) {
        throw new Error('Failed to fetch meta data: ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      if (data && data.title) {
        console.log('Received meta data:', data);
        
        // Create the important meta information
        const fullTitle = `${data.title} by ${data.artistName} | Listen on All Platforms`;
        const description = data.description || `Stream or download ${data.title} by ${data.artistName}. Available on Spotify, Apple Music, and more streaming platforms.`;
        
        // Make sure image URL is absolute
        const artworkUrl = data.artworkUrl.startsWith('http') 
          ? data.artworkUrl 
          : `${siteUrl}${data.artworkUrl.startsWith('/') ? '' : '/'}${data.artworkUrl}`;
        
        // Set page title
        document.title = fullTitle;
        
        // Update all meta tags - doing this immediately and with high priority
        const metaTags = [
          { property: 'og:title', content: fullTitle },
          { property: 'og:description', content: description },
          { property: 'og:image', content: artworkUrl },
          { property: 'og:url', content: `${siteUrl}/link/${slug}` },
          { property: 'og:type', content: 'music.song' },
          { name: 'twitter:card', content: 'summary_large_image' },
          { name: 'twitter:title', content: fullTitle },
          { name: 'twitter:description', content: description },
          { name: 'twitter:image', content: artworkUrl },
          { name: 'description', content: description }
        ];
        
        // Store meta data globally
        window.smartLinkData = {
          title: data.title,
          artistName: data.artistName,
          description: description,
          artworkUrl: artworkUrl,
        };
        
        // Create meta tags if they don't exist or update existing ones
        metaTags.forEach(tag => {
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

        // Create preemptive SSR redirect for crawlers
        if (isCrawler) {
          console.log('Crawler detected, ensuring redirect to SSR version');
          // Use a short timeout to ensure meta tags were at least attempted to be set first
          setTimeout(() => {
            window.location.href = `https://owtufhdsuuyrgmxytclj.supabase.co/functions/v1/smart-link-seo/${slug}`;
          }, 200);
        }
      }
    })
    .catch(error => {
      console.error('Error fetching smart link meta data:', error);
      
      // For crawlers, redirect directly to the SSR version as fallback
      if (isCrawler) {
        console.log('Error fetching meta, redirecting crawler to SSR version');
        window.location.href = `https://owtufhdsuuyrgmxytclj.supabase.co/functions/v1/smart-link-seo/${slug}`;
      }
    });
})();
