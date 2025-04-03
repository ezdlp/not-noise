
/**
 * Enhanced crawler detector script that:
 * 1. Detects a wide range of social media and search crawler user agents
 * 2. Sets meta tags immediately for crawlers that don't execute JavaScript 
 * 3. Works alongside Vercel routing for better SEO
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
  
  // Comprehensive list of known crawler patterns
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
    
    // Catch-all for metadata scrapers
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
  const isWhatsApp = /whatsapp/i.test(userAgent);
  console.log('Is crawler detected:', isCrawler);
  console.log('Is WhatsApp detected:', isWhatsApp);
  
  // Add escaped fragment for crawlers (helps with routing)
  if (isCrawler && window.location.href.indexOf('?_escaped_fragment_=') === -1) {
    console.log('Adding _escaped_fragment_ for crawler routing');
    
    // This query parameter will trigger the Vercel rewrite rule
    const newUrl = window.location.origin + window.location.pathname + '?_escaped_fragment_=true';
    
    // For some crawlers that support JavaScript, we can redirect
    try {
      window.history.replaceState(null, '', newUrl);
    } catch (e) {
      console.error('Failed to update history state:', e);
    }
  }
  
  // Even for non-crawlers, immediately fetch and set meta tags for better UX and as a fallback
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
        
        // Format the important meta information
        const fullTitle = `${data.title} by ${data.artistName} | Listen on All Platforms`;
        // For WhatsApp, use a shorter title (WhatsApp often truncates long titles)
        const shortTitle = isWhatsApp ? `${data.title} by ${data.artistName}` : fullTitle;
        
        const description = data.description || `Stream or download ${data.title} by ${data.artistName}. Available on Spotify, Apple Music, and more streaming platforms.`;
        // WhatsApp sometimes truncates descriptions, so provide a shorter version
        const shortDesc = isWhatsApp && description.length > 80 ? description.substring(0, 77) + '...' : description;
        
        // Make sure image URL is absolute
        const artworkUrl = data.artworkUrl.startsWith('http') 
          ? data.artworkUrl 
          : `${siteUrl}${data.artworkUrl.startsWith('/') ? '' : '/'}${data.artworkUrl}`;
        
        // Set page title
        document.title = fullTitle;
        
        // Store meta data globally for React components to use
        window.smartLinkData = {
          title: data.title,
          artistName: data.artistName,
          description: description,
          artworkUrl: artworkUrl,
        };
        
        // Update all meta tags immediately with high priority
        updateMetaTags(
          isWhatsApp ? shortTitle : fullTitle,
          isWhatsApp ? shortDesc : description,
          artworkUrl,
          `${siteUrl}/link/${slug}`,
          isWhatsApp
        );
        
        // Also update structured data
        updateStructuredData(
          data.title, 
          data.artistName, 
          artworkUrl, 
          description, 
          data.releaseDate, 
          `${siteUrl}/link/${slug}`
        );
      }
    })
    .catch(error => {
      console.error('Error fetching smart link meta data:', error);
    });
    
  /**
   * Updates meta tags in the document head with provided values
   * Optimizes for WhatsApp when isWhatsApp is true
   */
  function updateMetaTags(title, description, image, url, isWhatsApp) {
    // For WhatsApp, we want to optimize the meta tags sequence and structure
    if (isWhatsApp) {
      // WhatsApp optimization: Create critical OG tags first and at the top of head
      const criticalMetaTags = [
        { property: 'og:site_name', content: 'Soundraiser' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:image', content: image },
        { property: 'og:url', content: url },
        { property: 'og:type', content: 'music.song' },
      ];
      
      // Apply critical meta tags at the TOP of head (order matters for WhatsApp)
      criticalMetaTags.forEach(tag => {
        // Remove existing tag if it exists
        const existing = document.querySelector(`meta[property="${tag.property}"]`);
        if (existing) {
          existing.remove();
        }
        
        // Create new tag and insert at the beginning of head
        const meta = document.createElement('meta');
        meta.setAttribute('property', tag.property);
        meta.setAttribute('content', tag.content);
        
        // Insert at beginning of head
        const firstChild = document.head.firstChild;
        document.head.insertBefore(meta, firstChild);
      });
    }
    
    // Standard meta tags for all crawlers (including WhatsApp)
    const metaTags = [
      // Standard meta
      { name: 'description', content: description },
      { name: 'robots', content: 'index, follow' },
      
      // Open Graph basic (these will be duplicates for WhatsApp, but that's OK)
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:url', content: url },
      { property: 'og:type', content: 'music.song' },
      { property: 'og:site_name', content: 'Soundraiser' },
      
      // Twitter
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
      
      // Facebook-specific meta
      { property: 'fb:app_id', content: '1325418224779181' },
      
      // Music-specific (for rich previews)
      { property: 'music:musician', content: `${siteUrl}/artist/${encodeURIComponent(title.split(' by ')[1].split(' |')[0])}` },
      { property: 'music:song', content: url },
    ];
    
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
    canonical.setAttribute('href', url);
    
    console.log('Meta tags updated for ' + (isWhatsApp ? 'WhatsApp' : 'standard') + ' with:', { title, description, image, url });
  }
  
  /**
   * Updates the structured data schema.org script in the head
   */
  function updateStructuredData(title, artistName, image, description, releaseDate, url) {
    let structuredData = document.querySelector('script[type="application/ld+json"]');
    if (!structuredData) {
      structuredData = document.createElement('script');
      structuredData.setAttribute('type', 'application/ld+json');
      document.head.appendChild(structuredData);
    }
    
    const musicSchema = {
      "@context": "https://schema.org",
      "@type": "MusicRecording",
      "name": title,
      "byArtist": {
        "@type": "MusicGroup",
        "name": artistName
      },
      "image": image,
      "description": description,
      ...(releaseDate && { "datePublished": releaseDate }),
      "url": url,
      "publisher": {
        "@type": "Organization",
        "name": "Soundraiser",
        "logo": {
          "@type": "ImageObject",
          "url": `${siteUrl}/lovable-uploads/soundraiser-logo/Logo A.png`
        }
      }
    };
    
    structuredData.textContent = JSON.stringify(musicSchema);
    console.log('Structured data updated for:', title);
  }
})();
