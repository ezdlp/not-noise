
/**
 * This script runs immediately to detect crawler user agents
 * and update meta tags accordingly if the URL is a smart link
 */
(function() {
  // First check if we're on a smart link path
  const path = window.location.pathname;
  if (!path.startsWith('/link/')) return;
  
  const slug = path.split('/').pop();
  if (!slug) return;
  
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
    /mediapartners-google/i
  ];
  
  const userAgent = navigator.userAgent;
  
  // Check if the current user agent matches any crawler pattern
  const isCrawler = crawlerPatterns.some(pattern => pattern.test(userAgent));
  
  if (isCrawler) {
    console.log('Crawler detected:', userAgent);
    
    // For crawlers, redirect to the SSR version if not already there
    // This is a fallback in case the Vercel rewrite rule didn't catch it
    window.location.href = `https://owtufhdsuuyrgmxytclj.supabase.co/functions/v1/smart-link-seo/${slug}`;
  }
})();
