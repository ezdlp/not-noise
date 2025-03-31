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

    // Fetch the Edge Function response with proper authorization
    const response = await fetch(edgeFunctionUrl, {
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'User-Agent': userAgent
      }
    });

    if (!response.ok) {
      console.error(`[API] Edge Function error: ${response.status} ${response.statusText}`);
      
      // Get the error message
      const errorText = await response.text();
      console.error(`[API] Error details: ${errorText}`);
      
      // Return a fallback response for errors
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Soundraiser - Smart Links for Musicians</title>
          <meta property="og:title" content="Soundraiser - Smart Links for Musicians">
          <meta property="og:description" content="Create beautiful smart links for your music on all platforms">
          <meta property="og:image" content="https://soundraiser.io/soundraiser-og-image.jpg">
          <meta property="og:url" content="https://soundraiser.io/link/${slug}">
          <meta name="twitter:card" content="summary_large_image">
          <meta name="x-debug-info" content="API Error: ${response.status}">
        </head>
        <body>
          <h1>Soundraiser</h1>
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
    
    // Return a fallback response for errors
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Soundraiser - Smart Links for Musicians</title>
        <meta property="og:title" content="Soundraiser - Smart Links for Musicians">
        <meta property="og:description" content="Create beautiful smart links for your music on all platforms">
        <meta property="og:image" content="https://soundraiser.io/soundraiser-og-image.jpg">
        <meta property="og:url" content="https://soundraiser.io">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="x-debug-info" content="API Catch: ${error.message}">
      </head>
      <body>
        <h1>Soundraiser</h1>
        <p>Loading your music...</p>
        <script>window.location.href = '/';</script>
      </body>
      </html>
    `);
  }
} 