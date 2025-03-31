/// <reference lib="deno.ns" />
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors';

// Enhanced bot detection for social media crawlers
const KNOWN_BOTS = [
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'telegrambot',
  'slackbot',
  'discordbot',
  'googlebot',
  'bingbot',
  'yandex',
  'pinterest',
  'redditbot',
];

// Cache for generated HTML to improve performance
const CACHE = new Map<string, { html: string, timestamp: number }>();
// Cache expiration time: 1 hour
const CACHE_TTL = 60 * 60 * 1000;

// Helper function to escape HTML special characters
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Helper function to ensure URLs are absolute
function ensureAbsoluteUrl(url: string, baseUrl: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return new URL(url, baseUrl).toString();
}

Deno.serve(async (req) => {
  // Handle CORS for preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');
    console.log(`[Edge Function] Processing request for slug: ${slug}`);

    // Check if slug parameter is provided
    if (!slug) {
      return new Response('Missing slug parameter', { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
      });
    }

    // Check if we have a cached version
    const cacheKey = slug;
    const cachedData = CACHE.get(cacheKey);
    const now = Date.now();
    
    if (cachedData && (now - cachedData.timestamp) < CACHE_TTL) {
      console.log(`[Edge Function] Returning cached HTML for slug: ${slug}`);
      return new Response(cachedData.html, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch smart link data from Supabase
    console.log(`[Edge Function] Fetching data for slug: ${slug}`);
    const { data: smartLink, error } = await supabase
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
          platform_id,
          platform_name,
          url
        )
      `)
      .eq('slug', slug)
      .maybeSingle();

    // Handle error or missing data
    if (error || !smartLink) {
      console.error(`[Edge Function] Error fetching smart link:`, error);
      return new Response('Smart link not found', {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    console.log(`[Edge Function] Successfully fetched data for: ${smartLink.title}`);

    // Create absolute URLs
    const baseUrl = url.origin;
    const artworkUrl = ensureAbsoluteUrl(smartLink.artwork_url, baseUrl);
    const canonicalUrl = `${baseUrl}/link/${slug}`;
    
    // Generate HTML with proper meta tags for social media
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(smartLink.title)} by ${escapeHtml(smartLink.artist_name)} | Soundraiser</title>
    
    <!-- Standard Meta Tags -->
    <meta name="description" content="${escapeHtml(smartLink.description || `Listen to ${smartLink.title} by ${smartLink.artist_name} on all platforms`)}">
    <link rel="canonical" href="${canonicalUrl}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="music.song">
    <meta property="og:title" content="${escapeHtml(smartLink.title)} by ${escapeHtml(smartLink.artist_name)}">
    <meta property="og:description" content="${escapeHtml(smartLink.description || `Listen to ${smartLink.title} by ${smartLink.artist_name} on all platforms`)}">
    <meta property="og:image" content="${artworkUrl}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:site_name" content="Soundraiser">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(smartLink.title)} by ${escapeHtml(smartLink.artist_name)}">
    <meta name="twitter:description" content="${escapeHtml(smartLink.description || `Listen to ${smartLink.title} by ${smartLink.artist_name} on all platforms`)}">
    <meta name="twitter:image" content="${artworkUrl}">
    <meta name="twitter:site" content="@soundraiser">
    
    <!-- Music Specific Meta Tags -->
    <meta property="music:musician" content="${canonicalUrl}">
    <meta property="music:release_date" content="${smartLink.release_date || ''}">
    
    <!-- Preload critical assets -->
    <link rel="preload" as="image" href="${artworkUrl}">
    
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        background-color: #f9f9f9;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        text-align: center;
      }
      .artwork {
        width: 100%;
        max-width: 300px;
        height: auto;
        border-radius: 8px;
        margin-bottom: 20px;
      }
      h1 {
        margin: 0 0 10px;
        color: #111827;
      }
      .artist {
        color: #6851FB;
        margin: 0 0 20px;
        font-weight: 500;
      }
      .cta {
        display: inline-block;
        background: #6851FB;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        margin-top: 20px;
        transition: background 0.2s;
      }
      .cta:hover {
        background: #4A47A5;
      }
      .footer {
        margin-top: 30px;
        font-size: 14px;
        color: #6B7280;
      }
    </style>
</head>
<body>
    <div class="container">
        <img src="${artworkUrl}" alt="${escapeHtml(smartLink.title)} artwork" class="artwork">
        <h1>${escapeHtml(smartLink.title)}</h1>
        <p class="artist">by ${escapeHtml(smartLink.artist_name)}</p>
        
        <p>${escapeHtml(smartLink.description || `Listen to ${smartLink.title} by ${smartLink.artist_name} on all platforms`)}</p>
        
        <a href="${canonicalUrl}" class="cta">Listen Now</a>
        
        <div class="footer">
            <p>Powered by Soundraiser</p>
        </div>
    </div>
    
    <script>
      // Redirect to the React app if not a bot
      function checkIfBot() {
        const userAgent = navigator.userAgent.toLowerCase();
        const knownBots = ${JSON.stringify(KNOWN_BOTS)};
        const isBot = knownBots.some(bot => userAgent.includes(bot));
        
        if (!isBot) {
          console.log('Not a bot, redirecting to React app');
          window.location.href = "${canonicalUrl}";
        }
      }
      
      // Wait a moment and check if we should redirect
      setTimeout(checkIfBot, 500);
    </script>
</body>
</html>`;

    // Cache the generated HTML
    CACHE.set(cacheKey, { html, timestamp: now });
    
    console.log(`[Edge Function] Returning generated HTML for: ${smartLink.title}`);
    
    return new Response(html, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (error) {
    console.error(`[Edge Function] Error:`, error);
    return new Response(`Error: ${error.message}`, {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  }
}); 