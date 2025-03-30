
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

// Initialize Supabase client with environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

console.log('Smart Link Preview Edge Function: Initializing with environment variables', {
  supabaseUrlSet: !!supabaseUrl,
  supabaseKeySet: !!supabaseKey,
});

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getAbsoluteUrl(url?: string): string {
  if (!url) return 'https://soundraiser.io/soundraiser-og-image.jpg';
  const baseUrl = 'https://soundraiser.io';
  return url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

// HTML template for social media previews
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
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="URL_PLACEHOLDER">
  <meta property="og:site_name" content="Soundraiser">
  
  <!-- Facebook Specific -->
  <meta property="fb:app_id" content="1032091254648768">
  
  <!-- Twitter Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="TITLE_PLACEHOLDER">
  <meta name="twitter:description" content="DESCRIPTION_PLACEHOLDER">
  <meta name="twitter:image" content="IMAGE_PLACEHOLDER">
  
  <!-- Music Specific Tags -->
  <meta property="music:musician" content="ARTIST_MUSICIAN_URL_PLACEHOLDER">
  <meta property="music:release_date" content="RELEASE_DATE_PLACEHOLDER">

  <!-- Debug header -->
  <meta name="x-soundraiser-debug" content="smart-link:SLUG_PLACEHOLDER:supabase-edge">
  <meta name="x-soundraiser-useragent" content="USER_AGENT_PLACEHOLDER">
  
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
  
  <!-- Redirect to actual page after meta tags are read -->
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
  <meta property="og:image" content="https://soundraiser.io/soundraiser-og-image.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="https://soundraiser.io">
  <meta property="og:site_name" content="Soundraiser">
  
  <!-- Facebook Specific -->
  <meta property="fb:app_id" content="1032091254648768">
  
  <!-- Twitter Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Soundraiser - Smart Links for Musicians">
  <meta name="twitter:description" content="Create beautiful smart links for your music on all platforms. Promote your releases effectively.">
  <meta name="twitter:image" content="https://soundraiser.io/soundraiser-og-image.jpg">
  
  <!-- Debug information -->
  <meta name="x-soundraiser-debug" content="error-fallback">
  <meta name="x-soundraiser-useragent" content="USER_AGENT_PLACEHOLDER">
</head>
<body>
  <h1>Soundraiser</h1>
  <p>Smart Links for Musicians</p>
  <script>
    window.location.href = "https://soundraiser.io";
  </script>
</body>
</html>`;

// Cache to store recently generated previews (TTL: 1 hour)
const previewCache = new Map<string, { html: string, timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

serve(async (req) => {
  // Get the User-Agent for debugging
  const userAgent = req.headers.get('user-agent') || '';
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');
  
  console.log('Smart Link Preview Edge Function: Request received', {
    method: req.method,
    url: req.url,
    slug,
    userAgent: userAgent.substring(0, 100), // Truncate for readability
    headers: Array.from(req.headers.entries()).reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>)
  });

  // Check for preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  }

  // Set CORS and cache headers for all responses
  const responseHeaders = {
    ...corsHeaders,
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    'X-Smart-Link-Debug': 'edge-function-response',
    'X-Smart-Link-Slug': slug || 'none',
    'X-Smart-Link-UserAgent': userAgent.substring(0, 50) // Truncate for header size limits
  };

  try {
    console.log('Smart Link Preview Edge Function: Processing request', { slug });

    if (!slug) {
      console.error('Smart Link Preview Edge Function: Missing slug parameter');
      return new Response(
        ERROR_HTML.replace(/USER_AGENT_PLACEHOLDER/g, escapeHtml(userAgent)), 
        { 
          status: 200,
          headers: responseHeaders 
        }
      );
    }

    // Check cache first
    const cacheKey = `smartlink:${slug}`;
    const cachedPreview = previewCache.get(cacheKey);
    const now = Date.now();
    
    if (cachedPreview && (now - cachedPreview.timestamp) < CACHE_TTL) {
      console.log(`Smart Link Preview Edge Function: Cache hit for slug: ${slug}`);
      return new Response(cachedPreview.html, { 
        status: 200,
        headers: responseHeaders 
      });
    }

    console.log(`Smart Link Preview Edge Function: Cache miss, generating preview for slug: ${slug}`);

    // Validate Supabase credentials
    if (!supabaseUrl || !supabaseKey) {
      console.error('Smart Link Preview Edge Function: Supabase credentials missing:', { 
        url: supabaseUrl ? 'Set' : 'Missing', 
        key: supabaseKey ? 'Set' : 'Missing' 
      });
      return new Response(
        ERROR_HTML.replace(/USER_AGENT_PLACEHOLDER/g, escapeHtml(userAgent)), 
        { 
          status: 200,
          headers: responseHeaders 
        }
      );
    }

    // Fetch smart link data from Supabase
    const smartLinkResult = await supabase
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

    const { data: smartLink, error } = smartLinkResult;

    if (error) {
      console.error('Smart Link Preview Edge Function: Error fetching smart link:', error);
      return new Response(
        ERROR_HTML.replace(/USER_AGENT_PLACEHOLDER/g, escapeHtml(userAgent)), 
        { 
          status: 200,
          headers: responseHeaders 
        }
      );
    }

    if (!smartLink) {
      console.error(`Smart Link Preview Edge Function: Smart link not found for slug: ${slug}`);
      return new Response(
        ERROR_HTML.replace(/USER_AGENT_PLACEHOLDER/g, escapeHtml(userAgent)), 
        { 
          status: 200,
          headers: responseHeaders 
        }
      );
    }

    console.log('Smart Link Preview Edge Function: Found smart link data:', {
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
    
    // Get musician URL if available (first platform link)
    const musicianUrl = smartLink.platform_links && smartLink.platform_links.length > 0 
      ? smartLink.platform_links[0].url 
      : pageUrl;
      
    // Format release date if available
    const releaseDate = smartLink.release_date || '';

    console.log('Smart Link Preview Edge Function: Prepared template data:', {
      title,
      description: description.substring(0, 30) + '...',
      artworkUrl,
      pageUrl,
      releaseDate
    });

    // Replace placeholders in template
    let html = HTML_TEMPLATE
      .replace(/TITLE_PLACEHOLDER/g, escapeHtml(title))
      .replace(/DESCRIPTION_PLACEHOLDER/g, escapeHtml(description))
      .replace(/IMAGE_PLACEHOLDER/g, artworkUrl)
      .replace(/URL_PLACEHOLDER/g, pageUrl)
      .replace(/ARTIST_PLACEHOLDER/g, escapeHtml(smartLink.artist_name))
      .replace(/ARTIST_MUSICIAN_URL_PLACEHOLDER/g, musicianUrl)
      .replace(/RELEASE_DATE_PLACEHOLDER/g, releaseDate)
      .replace(/SLUG_PLACEHOLDER/g, slug)
      .replace(/USER_AGENT_PLACEHOLDER/g, escapeHtml(userAgent));

    // Store in cache
    previewCache.set(cacheKey, { html, timestamp: now });
    
    // Clean up old cache entries (simple janitor)
    if (now % 10 === 0) { // Run cleanup randomly (~10% of requests)
      console.log('Smart Link Preview Edge Function: Running cache cleanup');
      for (const [key, value] of previewCache.entries()) {
        if ((now - value.timestamp) > CACHE_TTL) {
          previewCache.delete(key);
        }
      }
    }

    // Set content type and send response
    console.log('Smart Link Preview Edge Function: Sending HTML response');
    return new Response(html, {
      status: 200,
      headers: responseHeaders
    });
  } catch (error) {
    console.error('Smart Link Preview Edge Function: Error in handler:', error);
    return new Response(
      ERROR_HTML.replace(/USER_AGENT_PLACEHOLDER/g, escapeHtml(userAgent)), 
      {
        status: 200,
        headers: responseHeaders
      }
    );
  }
});
