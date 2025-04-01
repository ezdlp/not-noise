
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
  
  console.log('Smart link path detected:', path, 'Slug:', slug);
  
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
  
  if (isCrawler) {
    console.log('Crawler detected:', userAgent);
    
    // Set a fallback meta tags immediately so there's something for the crawler
    document.title = `Listen on All Platforms - Soundraiser`;
    
    // Create and inject OG meta tags if they don't exist
    const metaTags = [
      { property: 'og:title', content: `Listen on All Platforms - Soundraiser` },
      { property: 'og:description', content: `Stream or download music across all major platforms with a single link.` },
      { property: 'og:url', content: window.location.href },
      { property: 'og:type', content: 'music.song' },
      { property: 'og:image', content: '/lovable-uploads/soundraiser-logo/Logo A.png' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: `Listen on All Platforms - Soundraiser` },
      { name: 'twitter:description', content: `Stream or download music across all major platforms with a single link.` },
      { name: 'twitter:image', content: '/lovable-uploads/soundraiser-logo/Logo A.png' }
    ];
    
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
    
    // Attempt to get SEO data directly
    fetch(`https://owtufhdsuuyrgmxytclj.supabase.co/functions/v1/smart-link-meta/${slug}`)
      .then(response => response.json())
      .then(data => {
        if (data && data.title) {
          console.log('Received meta data:', data);
          
          // Update title and meta tags with actual data
          document.title = `${data.title} by ${data.artistName} | Listen on All Platforms`;
          
          // Update OG meta tags
          const metaTitle = document.querySelector('meta[property="og:title"]');
          if (metaTitle) metaTitle.setAttribute('content', `${data.title} by ${data.artistName} | Listen on All Platforms`);
          
          const metaDesc = document.querySelector('meta[property="og:description"]');
          if (metaDesc) metaDesc.setAttribute('content', data.description || `Stream or download ${data.title} by ${data.artistName}. Available on Spotify, Apple Music, and more streaming platforms.`);
          
          const metaImage = document.querySelector('meta[property="og:image"]');
          if (metaImage) metaImage.setAttribute('content', data.artworkUrl);
          
          // Update Twitter meta tags
          const twitterTitle = document.querySelector('meta[name="twitter:title"]');
          if (twitterTitle) twitterTitle.setAttribute('content', `${data.title} by ${data.artistName} | Listen on All Platforms`);
          
          const twitterDesc = document.querySelector('meta[name="twitter:description"]');
          if (twitterDesc) twitterDesc.setAttribute('content', data.description || `Stream or download ${data.title} by ${data.artistName}. Available on Spotify, Apple Music, and more streaming platforms.`);
          
          const twitterImage = document.querySelector('meta[name="twitter:image"]');
          if (twitterImage) twitterImage.setAttribute('content', data.artworkUrl);
        }
      })
      .catch(error => {
        console.error('Error fetching smart link meta data:', error);
      });
    
    // For crawlers, redirect to the SSR version if not already there
    // This is a fallback in case the Vercel rewrite rule didn't catch it
    setTimeout(() => {
      // Check if any OG meta tags were populated with real data
      const ogImage = document.querySelector('meta[property="og:image"]');
      const ogTitle = document.querySelector('meta[property="og:title"]');
      
      // If we still have default values after a timeout, force redirect to the SSR version
      if ((!ogImage || ogImage.getAttribute('content') === '/lovable-uploads/soundraiser-logo/Logo A.png') &&
          (!ogTitle || ogTitle.getAttribute('content') === 'Listen on All Platforms - Soundraiser')) {
        console.log('Meta tags not populated with real data, redirecting to SSR version');
        window.location.href = `https://owtufhdsuuyrgmxytclj.supabase.co/functions/v1/smart-link-seo/${slug}`;
      }
    }, 500);
  }
})();
