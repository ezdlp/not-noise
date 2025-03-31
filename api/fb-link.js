// Simple direct API endpoint specifically for Facebook crawlers
export default async function handler(req, res) {
  const slug = req.query.slug;
  
  if (!slug) {
    return res.status(400).send('Missing slug parameter');
  }
  
  try {
    // Call the Supabase Edge Function directly
    const edgeFunctionUrl = `https://owtufhdsuuyrgmxytclj.supabase.co/functions/v1/render-smart-link?slug=${encodeURIComponent(slug)}`;
    console.log(`[FB Link] Fetching from Edge Function: ${edgeFunctionUrl}`);
    
    const response = await fetch(edgeFunctionUrl);
    
    if (!response.ok) {
      console.error(`[FB Link] Edge Function error: ${response.status}`);
      
      // Basic fallback
      const formattedTitle = slug.replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${formattedTitle} | Soundraiser</title>
          <meta property="og:title" content="${formattedTitle} | Soundraiser">
          <meta property="og:type" content="music.song">
          <meta property="og:image" content="https://soundraiser.io/soundraiser-og-image.jpg">
          <meta property="og:url" content="https://soundraiser.io/link/${slug}">
        </head>
        <body>
          <h1>${formattedTitle}</h1>
          <script>window.location.href='/link/${slug}';</script>
        </body>
        </html>
      `);
    }
    
    // Return the HTML from the Edge Function
    const html = await response.text();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (error) {
    console.error(`[FB Link] Error: ${error.message}`);
    
    // Fallback
    const formattedTitle = slug.replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${formattedTitle} | Soundraiser</title>
        <meta property="og:title" content="${formattedTitle} | Soundraiser">
        <meta property="og:type" content="music.song">
        <meta property="og:image" content="https://soundraiser.io/soundraiser-og-image.jpg">
        <meta property="og:url" content="https://soundraiser.io/link/${slug}">
      </head>
      <body>
        <h1>${formattedTitle}</h1>
        <script>window.location.href='/link/${slug}';</script>
      </body>
      </html>
    `);
  }
} 