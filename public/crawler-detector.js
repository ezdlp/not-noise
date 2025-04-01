
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
  
  // Enhanced list of known crawler patterns - expanded to catch more crawlers
  const crawlerPatterns = [
    // Social media crawlers
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
    /whatsapp/i,
    
    // Search engine crawlers
    /google/i,
    /googlebot/i,
    /bot/i,
    /crawler/i,
    /spider/i,
    /yandex/i,
    /bingbot/i,
    /slurp/i, // Yahoo
    /duckduckbot/i,
    /baiduspider/i,
    /mediapartners-google/i,
    
    // Generic API clients that might be used by crawlers
    /axios/i,
    /curl/i,
    /wget/i,
    /jsdom/i,
    /HeadlessChrome/i,
    /Playwright/i,
    /Puppeteer/i,
    
    // Catch-all for metadata scrapers (many use "bot" or "scraper" in UA)
    /meta/i,
    /scraper/i,
    /preview/i,
    /embed/i,
    /ogp/i,
  ];
  
  const userAgent = navigator.userAgent;
  console.log('User agent:', userAgent);
  
  // Check if the current user agent matches any crawler pattern
  const isCrawler = crawlerPatterns.some(pattern => pattern.test(userAgent));
  console.log('Is crawler detected:', isCrawler);
  
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
          // Standard meta
          { name: 'description', content: description },
          { name: 'robots', content: 'index, follow' },
          
          // Open Graph basic
          { property: 'og:title', content: fullTitle },
          { property: 'og:description', content: description },
          { property: 'og:image', content: artworkUrl },
          { property: 'og:url', content: `${siteUrl}/link/${slug}` },
          { property: 'og:type', content: 'music.song' },
          { property: 'og:site_name', content: 'Soundraiser' },
          
          // Twitter
          { name: 'twitter:card', content: 'summary_large_image' },
          { name: 'twitter:title', content: fullTitle },
          { name: 'twitter:description', content: description },
          { name: 'twitter:image', content: artworkUrl },
          
          // Facebook-specific meta
          { property: 'fb:app_id', content: '1325418224779181' }, // Replace with your actual FB App ID if available
          
          // Music-specific (for rich previews)
          { property: 'music:musician', content: `${siteUrl}/artist/${encodeURIComponent(data.artistName)}` },
          { property: 'music:album', content: artworkUrl },
          { property: 'music:song', content: `${siteUrl}/link/${slug}` },
          { property: 'music:creator', content: data.artistName },
        ];
        
        // Store meta data globally for React components to use
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

        // Add a canonical link
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
          canonical = document.createElement('link');
          canonical.setAttribute('rel', 'canonical');
          document.head.appendChild(canonical);
        }
        canonical.setAttribute('href', `${siteUrl}/link/${slug}`);

        // Add structured data
        let structuredData = document.querySelector('script[type="application/ld+json"]');
        if (!structuredData) {
          structuredData = document.createElement('script');
          structuredData.setAttribute('type', 'application/ld+json');
          document.head.appendChild(structuredData);
        }
        
        const musicSchema = {
          "@context": "https://schema.org",
          "@type": "MusicRecording",
          "name": data.title,
          "byArtist": {
            "@type": "MusicGroup",
            "name": data.artistName
          },
          "image": artworkUrl,
          "description": description,
          "url": `${siteUrl}/link/${slug}`
        };
        
        structuredData.textContent = JSON.stringify(musicSchema);

        // Only redirect crawlers if we're already using the SSR approach, otherwise 
        // just rely on the meta tags we've injected
        if (isCrawler && window.location.href.indexOf('?_escaped_fragment_=') === -1) {
          console.log('Adding _escaped_fragment_ for crawler compatibility');
          // Add an _escaped_fragment_ parameter to help crawlers understand this is a dynamic page
          // This is a nod to the AJAX crawling scheme that some crawlers still respect
          history.replaceState(null, '', `${window.location.pathname}?_escaped_fragment_=true`);
        }
      }
    })
    .catch(error => {
      console.error('Error fetching smart link meta data:', error);
    });
})();
