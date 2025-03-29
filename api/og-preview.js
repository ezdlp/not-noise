// Import required dependencies
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (with fallbacks for environment variables)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

console.log('OG Preview API v1.0.2: Initializing with environment variables', {
  supabaseUrlSet: !!supabaseUrl,
  supabaseKeySet: !!supabaseKey,
  nodeEnv: process.env.NODE_ENV,
});

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getAbsoluteUrl(url) {
  if (!url) return 'https://soundraiser.io/og-image.png';
  const baseUrl = 'https://soundraiser.io';
  return url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

// Hardcoded HTML template
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TITLE_PLACEHOLDER</title>
  <meta name="description" content="DESCRIPTION_PLACEHOLDER">
  
  <!-- OpenGraph Tags -->
  <meta property="og:type" content="music.song">
  <meta property="og:title" content="TITLE_PLACEHOLDER">
  <meta property="og:description" content="DESCRIPTION_PLACEHOLDER">
  <meta property="og:image" content="IMAGE_PLACEHOLDER">
  <meta property="og:url" content="URL_PLACEHOLDER">
  <meta property="og:site_name" content="Soundraiser">
  
  <!-- Twitter Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="TITLE_PLACEHOLDER">
  <meta name="twitter:description" content="DESCRIPTION_PLACEHOLDER">
  <meta name="twitter:image" content="IMAGE_PLACEHOLDER">
  
  <style>
    body {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #fafafa;
      color: #333;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      text-align: center;
      padding: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .artwork {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    h1 {
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 24px;
      margin-bottom: 8px;
    }
    .artist {
      font-family: 'Poppins', sans-serif;
      font-weight: 500;
      font-size: 18px;
      margin-top: 0;
      color: #555;
    }
    .cta {
      display: inline-block;
      background-color: #6851FB;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 500;
      margin-top: 24px;
      transition: all 0.2s ease;
    }
    .cta:hover {
      background-color: #5344cf;
      transform: translateY(-2px);
    }
  </style>
  
  <!-- Redirect to actual page -->
  <script>
    window.location.href = "URL_PLACEHOLDER";
  </script>
</head>
<body>
  <div class="container">
    <img class="artwork" src="IMAGE_PLACEHOLDER" alt="TITLE_PLACEHOLDER">
    <h1>TITLE_PLACEHOLDER</h1>
    <p class="artist">by ARTIST_PLACEHOLDER</p>
    <a href="URL_PLACEHOLDER" class="cta">Listen Now</a>
  </div>
</body>
</html>`;

// Fallback HTML for error cases
const ERROR_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Soundraiser - Smart Links for Musicians</title>
  <meta name="description" content="Create beautiful smart links for your music on all platforms. Promote your releases effectively.">
  
  <!-- OpenGraph Tags -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="Soundraiser - Smart Links for Musicians">
  <meta property="og:description" content="Create beautiful smart links for your music on all platforms. Promote your releases effectively.">
  <meta property="og:image" content="https://soundraiser.io/og-image.png">
  <meta property="og:url" content="https://soundraiser.io">
  <meta property="og:site_name" content="Soundraiser">
  
  <!-- Twitter Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Soundraiser - Smart Links for Musicians">
  <meta name="twitter:description" content="Create beautiful smart links for your music on all platforms. Promote your releases effectively.">
  <meta name="twitter:image" content="https://soundraiser.io/og-image.png">
</head>
<body>
  <h1>Soundraiser</h1>
  <p>Smart Links for Musicians</p>
  <script>
    window.location.href = "https://soundraiser.io";
  </script>
</body>
</html>`;

module.exports = async (req, res) => {
  console.log('OG Preview API v1.0.2: Request received', {
    method: req.method,
    url: req.url,
    query: req.query,
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      'x-forwarded-for': req.headers['x-forwarded-for']
    }
  });

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Cache control - allow caching for 1 hour
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  
  try {
    // Get slug from URL parameters
    const slug = req.query.slug;
    if (!slug) {
      console.error('OG Preview API: Missing slug parameter');
      return res.status(200).send(ERROR_HTML);
    }

    console.log(`OG Preview API: Generating preview for slug: ${slug}`);

    // Check if Supabase client is initialized properly
    if (!supabaseUrl || !supabaseKey) {
      console.error('OG Preview API: Supabase credentials missing:', { 
        url: supabaseUrl ? 'Set' : 'Missing', 
        key: supabaseKey ? 'Set' : 'Missing' 
      });
      return res.status(200).send(ERROR_HTML);
    }

    // Fetch smart link data from Supabase
    let smartLinkResult;
    try {
      console.log('OG Preview API: Querying Supabase for smart link data');
      smartLinkResult = await supabase
        .from('smart_links')
        .select(`
          id,
          title,
          artist_name,
          artwork_url,
          description,
          release_date,
          platform_links (
            id,
            platform_name,
            url
          )
        `)
        .eq('slug', slug)
        .maybeSingle();
    } catch (dbError) {
      console.error('OG Preview API: Supabase query error:', dbError);
      return res.status(200).send(ERROR_HTML);
    }

    const { data: smartLink, error } = smartLinkResult;

    if (error) {
      console.error('OG Preview API: Error fetching smart link:', error);
      return res.status(200).send(ERROR_HTML);
    }

    if (!smartLink) {
      console.error(`OG Preview API: Smart link not found for slug: ${slug}`);
      return res.status(200).send(ERROR_HTML);
    }

    console.log('OG Preview API: Found smart link data:', {
      id: smartLink.id,
      title: smartLink.title,
      artist: smartLink.artist_name,
      hasArtwork: !!smartLink.artwork_url,
      platformLinks: smartLink.platform_links?.length || 0
    });

    // Prepare data for template
    const title = `${smartLink.title} by ${smartLink.artist_name} | Listen on All Platforms`;
    const description = smartLink.description || 
      `Stream or download ${smartLink.title} by ${smartLink.artist_name}. Available on Spotify, Apple Music, and more streaming platforms.`;
    const artworkUrl = getAbsoluteUrl(smartLink.artwork_url);
    const pageUrl = `https://soundraiser.io/link/${slug}`;

    console.log('OG Preview API: Prepared template data:', {
      title,
      description: description.substring(0, 30) + '...',
      artworkUrl,
      pageUrl
    });

    // Replace placeholders in template
    let html = HTML_TEMPLATE
      .replace(/TITLE_PLACEHOLDER/g, escapeHtml(title))
      .replace(/DESCRIPTION_PLACEHOLDER/g, escapeHtml(description))
      .replace(/IMAGE_PLACEHOLDER/g, artworkUrl)
      .replace(/URL_PLACEHOLDER/g, pageUrl)
      .replace(/ARTIST_PLACEHOLDER/g, escapeHtml(smartLink.artist_name));

    // Set content type and send response
    console.log('OG Preview API: Sending HTML response');
    return res.status(200).send(html);
  } catch (error) {
    console.error('OG Preview API: Error in handler:', error);
    return res.status(200).send(ERROR_HTML);
  }
}; 