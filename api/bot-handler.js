// Specialized API handler for social media bots
// This directly returns proper HTML with correct meta tags for social media crawlers
export default async function handler(req, res) {
  // Get the slug from the request query or path
  const slug = req.query.slug || '';
  const userAgent = req.headers['user-agent'] || '';
  
  console.log(`[Bot Handler] Processing request for slug: ${slug}`);
  console.log(`[Bot Handler] User-Agent: ${userAgent.substring(0, 100)}`);
  
  if (!slug) {
    console.error('[Bot Handler] Missing slug parameter');
    return res.status(404).send('Not found');
  }

  // Determine if the request is from a social media bot
  const isBot = /facebook|twitter|linkedin|pinterest|google|bot|whatsapp|telegram|slack|discord/i.test(userAgent);
  console.log(`[Bot Handler] Request identified as bot: ${isBot}`);
  
  try {
    // Fetch from the Edge Function directly - now using absolute URL
    const edgeFunctionUrl = `https://owtufhdsuuyrgmxytclj.supabase.co/functions/v1/render-smart-link?slug=${encodeURIComponent(slug)}`;
    console.log(`[Bot Handler] Fetching from Edge Function: ${edgeFunctionUrl}`);
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html'
      }
    });
    
    console.log(`[Bot Handler] Edge Function response status: ${response.status}`);
    
    if (!response.ok) {
      console.error(`[Bot Handler] Error fetching from Edge Function: ${response.status}`);
      
      // Fallback to direct HTML response with basic metadata
      const title = slug.replace(/-/g, ' ');
      const formattedTitle = title
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
        
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>${formattedTitle} | Soundraiser</title>
          <meta property="og:title" content="${formattedTitle} | Soundraiser">
          <meta property="og:type" content="music.song">
          <meta property="og:description" content="Listen to ${formattedTitle} on all platforms">
          <meta property="og:image" content="https://soundraiser.io/soundraiser-og-image.jpg">
          <meta property="og:url" content="https://soundraiser.io/link/${slug}">
          <meta name="twitter:card" content="summary_large_image">
          <meta name="x-debug-info" content="Bot handler fallback">
        </head>
        <body>
          <h1>${formattedTitle}</h1>
          <p>Loading your music...</p>
          <script>window.location.href = '/link/${slug}';</script>
        </body>
        </html>
      `);
    }
    
    // Get the HTML content from the Edge Function
    const html = await response.text();
    
    // Set headers for proper caching
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    
    // Return the HTML
    return res.status(200).send(html);
  } catch (error) {
    console.error(`[Bot Handler] Error: ${error.message}`);
    
    // Fallback to direct HTML response with basic metadata
    const title = slug.replace(/-/g, ' ');
    const formattedTitle = title
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
      
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${formattedTitle} | Soundraiser</title>
        <meta property="og:title" content="${formattedTitle} | Soundraiser">
        <meta property="og:type" content="music.song">
        <meta property="og:description" content="Listen to ${formattedTitle} on all platforms">
        <meta property="og:image" content="https://soundraiser.io/soundraiser-og-image.jpg">
        <meta property="og:url" content="https://soundraiser.io/link/${slug}">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="x-debug-info" content="Bot handler error: ${error.message.substring(0, 50).replace(/"/g, '&quot;')}">
      </head>
      <body>
        <h1>${formattedTitle}</h1>
        <p>Loading your music...</p>
        <script>window.location.href = '/link/${slug}';</script>
      </body>
      </html>
    `);
  }
} 