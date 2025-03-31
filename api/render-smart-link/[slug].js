// API route handler for /api/render-smart-link/[slug]
// This proxies requests to the Supabase Edge Function with proper authentication

export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    const userAgent = req.headers['user-agent'] || '';
    
    console.log(`[API] Processing smart link request for: ${slug}`);
    console.log(`[API] User Agent: ${userAgent.substring(0, 100)}`);

    if (!slug) {
      return res.status(400).send('Missing slug parameter');
    }

    // Get the Supabase URL and anon key from environment variables
    const supabaseUrl = process.env.SUPABASE_URL || 'https://owtufhdsuuyrgmxytclj.supabase.co';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

    // Construct the Edge Function URL
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/render-smart-link?slug=${encodeURIComponent(slug)}`;
    
    console.log(`[API] Proxying to Edge Function: ${edgeFunctionUrl}`);
    console.log(`[API] Using anon key: ${supabaseAnonKey.substring(0, 20)}...`);

    // Fetch the Edge Function response with proper authorization
    const response = await fetch(edgeFunctionUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'User-Agent': userAgent,
        'Accept': 'text/html,application/json',
      }
    });

    console.log(`[API] Edge Function response status: ${response.status} ${response.statusText}`);
    console.log(`[API] Edge Function response type: ${response.headers.get('content-type')}`);

    if (!response.ok) {
      console.error(`[API] Edge Function error: ${response.status} ${response.statusText}`);
      
      // Get the error message
      let errorText = '';
      try {
        errorText = await response.text();
        console.error(`[API] Error details: ${errorText}`);
      } catch (e) {
        console.error(`[API] Could not read error text: ${e.message}`);
      }
      
      // Try to generate a useful Smart Link preview despite the error
      const ogTitle = `${slug.replace(/-/g, ' ')} | Soundraiser`;
      const ogDescription = `Listen to this release on all streaming platforms`;
      
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${ogTitle}</title>
          <meta property="og:title" content="${ogTitle}">
          <meta property="og:description" content="${ogDescription}">
          <meta property="og:image" content="https://soundraiser.io/soundraiser-og-image.jpg">
          <meta property="og:url" content="https://soundraiser.io/link/${slug}">
          <meta property="og:type" content="music.song">
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="${ogTitle}">
          <meta name="twitter:description" content="${ogDescription}">
          <meta name="x-debug-info" content="API Error: ${response.status}">
          <meta name="x-error-details" content="${errorText.substring(0, 100).replace(/"/g, '&quot;')}">
        </head>
        <body>
          <h1>${ogTitle}</h1>
          <p>Loading your music...</p>
          <script>window.location.href = '/link/${slug}';</script>
        </body>
        </html>
      `);
    }

    // Get the HTML content
    const html = await response.text();
    
    // Set the appropriate headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    
    // Return the Edge Function response
    return res.status(200).send(html);
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    
    const slug = req.query.slug || 'unknown-slug';
    const ogTitle = `${slug.replace(/-/g, ' ')} | Soundraiser`;
    
    // Return a fallback response for errors
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${ogTitle}</title>
        <meta property="og:title" content="${ogTitle}">
        <meta property="og:description" content="Listen to this release on all streaming platforms">
        <meta property="og:image" content="https://soundraiser.io/soundraiser-og-image.jpg">
        <meta property="og:url" content="https://soundraiser.io/link/${slug}">
        <meta property="og:type" content="music.song">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${ogTitle}">
        <meta name="twitter:description" content="Listen to this release on all streaming platforms">
        <meta name="x-debug-info" content="API Catch: ${error.message.substring(0, 100).replace(/"/g, '&quot;')}">
      </head>
      <body>
        <h1>${ogTitle}</h1>
        <p>Loading your music...</p>
        <script>window.location.href = '/link/${slug}';</script>
      </body>
      </html>
    `);
  }
} 