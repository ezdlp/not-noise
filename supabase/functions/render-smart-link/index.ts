
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SmartLink {
  id: string
  title: string
  artist_name: string
  artwork_url: string
  description?: string
  release_date?: string
  content_type?: string
  platform_links?: {
    platform_name: string
    url: string
  }[]
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const userAgent = req.headers.get('user-agent') || '';
    const referer = req.headers.get('referer') || '';
    
    console.log(`[Render Smart Link] Request URL: ${url.toString()}`);
    console.log(`[Render Smart Link] User Agent: ${userAgent}`);
    console.log(`[Render Smart Link] Referer: ${referer}`);
    
    // Enhanced crawler detection with more user agents
    const crawlerRegex = /(facebook|twitter|linkedin|pinterest|whatsapp|telegram|discord|bot|crawl|spider|google|bing|yahoo|facebookexternalhit|facebot|instapaper|flipboard|tumblr|slackbot|skype|snapchat|pinterest|yandex)/i;
    const isCrawler = crawlerRegex.test(userAgent);
    console.log(`[Render Smart Link] Is crawler: ${isCrawler}`);
    
    if (isCrawler) {
      // More detailed debugging for crawler requests
      const crawlerMatches = userAgent.match(crawlerRegex);
      const crawlerType = crawlerMatches ? crawlerMatches[1] : 'Unknown crawler';
      console.log(`[Render Smart Link] Crawler type detected: ${crawlerType}`);
    }
    
    // Log all headers for debugging
    console.log(`[Render Smart Link] All headers:`, Object.fromEntries([...req.headers.entries()]));
    
    // Extract slug from path - handle different formats with enhanced logging
    let slug = '';
    
    // Check for different path patterns
    if (url.pathname.startsWith('/render-smart-link/')) {
      slug = url.pathname.replace(/^\/render-smart-link\//, '');
      console.log(`[Render Smart Link] Extracted from /render-smart-link/ path: ${slug}`);
    } else if (url.pathname.startsWith('/link/')) {
      slug = url.pathname.replace(/^\/link\//, '');
      // Remove any trailing '/seo' if present
      slug = slug.replace(/\/seo$/, '');
      console.log(`[Render Smart Link] Extracted from /link/ path: ${slug}`);
    } else if (url.pathname.startsWith('/social-api/link/')) {
      slug = url.pathname.replace(/^\/social-api\/link\//, '');
      console.log(`[Render Smart Link] Extracted from /social-api/link/ path: ${slug}`);
    } else if (url.pathname.startsWith('/og/')) {
      slug = url.pathname.replace(/^\/og\//, '');
      console.log(`[Render Smart Link] Extracted from /og/ path: ${slug}`);
    } else if (url.pathname.startsWith('/direct-link/')) {
      slug = url.pathname.replace(/^\/direct-link\//, '');
      console.log(`[Render Smart Link] Extracted from /direct-link/ path: ${slug}`);
    } else {
      // If none match, try a generic approach
      const segments = url.pathname.split('/').filter(Boolean);
      slug = segments.length ? segments[segments.length - 1] : '';
      console.log(`[Render Smart Link] Extracted using generic approach: ${slug}`);
    }
    
    // Remove any trailing slashes
    slug = slug ? slug.replace(/\/$/, '') : '';
    
    console.log(`[Render Smart Link] Final slug for lookup: "${slug}"`);
    
    if (!slug) {
      console.error('[Render Smart Link] Slug is required');
      return new Response('Slug is required', { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[Render Smart Link] Missing Supabase credentials');
      return new Response('Server configuration error', { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[Render Smart Link] Supabase client initialized');

    // Fetch the smart link data by slug first
    console.log(`[Render Smart Link] Attempting to fetch smart link with slug: ${slug}`);
    const { data: smartLinkBySlug, error: slugError } = await supabase
      .from('smart_links')
      .select(`
        *,
        platform_links (
          platform_name,
          url
        )
      `)
      .eq('slug', slug)
      .maybeSingle();

    if (slugError) {
      console.error(`[Render Smart Link] Error fetching by slug: ${slugError.message}`);
    } else {
      console.log(`[Render Smart Link] Slug search result: ${smartLinkBySlug ? 'Found' : 'Not found'}`);
    }

    // If not found by slug, try by ID
    if (!smartLinkBySlug && !slugError) {
      console.log(`[Render Smart Link] Attempting to fetch smart link with ID: ${slug}`);
      const { data: smartLinkById, error: idError } = await supabase
        .from('smart_links')
        .select(`
          *,
          platform_links (
            platform_name,
            url
          )
        `)
        .eq('id', slug)
        .maybeSingle();

      if (idError) {
        console.error(`[Render Smart Link] Error fetching by ID: ${idError.message}`);
        return new Response(JSON.stringify({ error: 'Error fetching smart link' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!smartLinkById) {
        console.error(`[Render Smart Link] Smart link not found by slug or ID: ${slug}`);
        return new Response(JSON.stringify({ error: 'Smart link not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`[Render Smart Link] Found smart link by ID: ${smartLinkById.id}`);
      return generateHtmlResponse(smartLinkById, req);
    }

    if (smartLinkBySlug) {
      console.log(`[Render Smart Link] Found smart link by slug: ${smartLinkBySlug.id}`);
      return generateHtmlResponse(smartLinkBySlug, req);
    } else {
      console.error(`[Render Smart Link] Smart link not found by slug or ID: ${slug}`);
      return new Response(JSON.stringify({ error: 'Smart link not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error(`[Render Smart Link] Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function generateHtmlResponse(smartLink: SmartLink, req: Request): Response {
  console.log(`[Render Smart Link] Generating HTML response for: ${smartLink.title} by ${smartLink.artist_name}`);
  
  const siteUrl = Deno.env.get('SITE_URL') || 'https://soundraiser.io';
  const fullTitle = `${smartLink.title} by ${smartLink.artist_name} | Listen on All Platforms`;
  const description = smartLink.description || 
    `Stream or download ${smartLink.title} by ${smartLink.artist_name}. Available on Spotify, Apple Music, and more streaming platforms.`;
  const canonical = `${siteUrl}/link/${smartLink.id}`;
  const userAgent = req.headers.get('user-agent') || '';
  const requestUrl = new URL(req.url).toString();
  const isCrawler = /facebook|twitter|linkedin|pinterest|whatsapp|telegram|discord|bot|crawl|spider|google|bing|yahoo|facebookexternalhit|facebot|instapaper|flipboard|tumblr|slackbot|skype|snapchat|pinterest|yandex/i.test(userAgent);

  // Generate schema markup for music
  const streamingPlatforms = smartLink.platform_links || [];
  const actionButtons = streamingPlatforms.map(platform => ({
    "@type": "ListenAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": platform.url,
      "actionPlatform": [
        "http://schema.org/MusicPlatform",
        platform.url
      ]
    },
    "expectsAcceptanceOf": {
      "@type": "Offer",
      "category": "stream"
    }
  }));

  const musicSchema = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    "name": smartLink.title,
    "byArtist": {
      "@type": "MusicGroup",
      "name": smartLink.artist_name,
      "@id": `${siteUrl}/artist/${encodeURIComponent(smartLink.artist_name)}`
    },
    "image": smartLink.artwork_url,
    "description": smartLink.description,
    ...(smartLink.release_date && { "datePublished": smartLink.release_date }),
    "potentialAction": actionButtons,
    "url": canonical,
    "offers": streamingPlatforms.map(platform => ({
      "@type": "Offer",
      "url": platform.url,
      "availability": "https://schema.org/InStock",
      "category": "stream"
    })),
    "publisher": {
      "@type": "Organization",
      "name": "Soundraiser",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/lovable-uploads/soundraiser-logo/Logo A.png`
      }
    }
  };

  // Generate HTML with the proper meta tags - enhanced version for better crawler support
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/lovable-uploads/soundraiser-logo/Iso A fav.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- Basic -->
    <title>${fullTitle}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonical}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="music.song" />
    <meta property="og:title" content="${fullTitle}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${smartLink.artwork_url}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:site_name" content="Soundraiser" />
    ${smartLink.release_date ? `<meta property="music:release_date" content="${smartLink.release_date}" />` : ''}
    ${streamingPlatforms.map(platform => `<meta property="music:musician" content="${platform.url}" />`).join('\n    ')}
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${fullTitle}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${smartLink.artwork_url}" />

    <!-- Debug Info (hidden in comments) -->
    <!-- Request URL: ${requestUrl} -->
    <!-- User Agent: ${userAgent} -->

    <!-- Schema.org structured data -->
    <script type="application/ld+json">
      ${JSON.stringify(musicSchema)}
    </script>
    
    <!-- Diagnostic meta tags -->
    <meta name="soundraiser:is-crawler" content="${isCrawler}" />
    <meta name="soundraiser:request-path" content="${requestUrl}" />
    <meta name="soundraiser:canonical" content="${canonical}" />
    <meta name="soundraiser:render-timestamp" content="${new Date().toISOString()}" />
    <meta name="soundraiser:version" content="1.0.3" />
    <meta name="soundraiser:non-spa-mode" content="true" />
    
    <!-- Enhanced styling for direct HTML rendering -->
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background: linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.9));
        color: #ffffff;
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        line-height: 1.5;
      }
      
      .container {
        max-width: 480px;
        width: 90%;
        background: rgba(15, 15, 20, 0.85);
        backdrop-filter: blur(15px);
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        margin: 2rem 0;
      }
      
      .artwork {
        width: 100%;
        height: auto;
        border-radius: 12px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        margin-bottom: 1.5rem;
      }
      
      h1 {
        font-size: 1.75rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        color: #ffffff;
      }
      
      h2 {
        font-size: 1.25rem;
        font-weight: 400;
        margin-bottom: 1.5rem;
        color: rgba(255,255,255,0.8);
      }
      
      p {
        margin-bottom: 1.5rem;
        color: rgba(255,255,255,0.7);
      }
      
      .platforms {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 2rem;
      }
      
      .platform-button {
        display: block;
        padding: 0.875rem 1rem;
        background: #6851FB;
        color: white;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 500;
        text-align: center;
        transition: all 0.2s ease;
      }
      
      .platform-button:hover {
        background: #5643e6;
        transform: translateY(-2px);
      }
      
      .footer {
        text-align: center;
        margin-top: 2rem;
        opacity: 0.7;
        font-size: 0.875rem;
      }
      
      .footer a {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: rgba(255,255,255,0.8);
        text-decoration: none;
      }
      
      .footer img {
        height: 24px;
        width: auto;
      }
      
      @media (max-width: 480px) {
        .container {
          width: 95%;
          padding: 1.5rem;
        }
        
        h1 {
          font-size: 1.5rem;
        }
        
        h2 {
          font-size: 1.1rem;
        }
      }
      
      /* Background blur effect */
      .page-background {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-size: cover;
        background-position: center;
        z-index: -1;
        filter: blur(20px) brightness(0.4);
      }
      
      /* Loading indicator and client-side redirect for non-crawler users */
      .redirect-message {
        position: fixed;
        bottom: 1rem;
        left: 0;
        right: 0;
        text-align: center;
        padding: 0.5rem;
        color: rgba(255,255,255,0.6);
        font-size: 0.875rem;
      }
      
      .lds-ring {
        display: inline-block;
        position: relative;
        width: 16px;
        height: 16px;
        vertical-align: middle;
        margin-right: 8px;
      }
      
      .lds-ring div {
        box-sizing: border-box;
        display: block;
        position: absolute;
        width: 12px;
        height: 12px;
        margin: 2px;
        border: 2px solid #fff;
        border-radius: 50%;
        animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        border-color: #fff transparent transparent transparent;
      }
      
      .lds-ring div:nth-child(1) { animation-delay: -0.45s; }
      .lds-ring div:nth-child(2) { animation-delay: -0.3s; }
      .lds-ring div:nth-child(3) { animation-delay: -0.15s; }
      
      @keyframes lds-ring {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>

    <script>
      // This script only runs for non-crawler visitors
      function detectCrawler() {
        const userAgent = navigator.userAgent.toLowerCase();
        return /bot|crawler|spider|crawling|facebook|twitter|linkedin|pinterest|whatsapp|telegram|discord|google|bing|yahoo|facebookexternalhit|facebot|instapaper|flipboard|tumblr|slackbot|skype|snapchat|pinterest|yandex/i.test(userAgent);
      }
      
      function loadFullExperience() {
        if (!detectCrawler()) {
          // For real users, redirect to the SPA version after 1 second
          setTimeout(() => {
            window.location.href = '/#' + window.location.pathname;
          }, 1000);
        }
      }
      
      // Run after DOM is loaded
      document.addEventListener('DOMContentLoaded', loadFullExperience);
    </script>
  </head>
  <body>
    <div class="page-background" style="background-image: url(${smartLink.artwork_url})"></div>
    
    <div class="container">
      <img src="${smartLink.artwork_url}" alt="${smartLink.title}" class="artwork" />
      <h1>${smartLink.title}</h1>
      <h2>by ${smartLink.artist_name}</h2>
      
      ${smartLink.description ? `<p>${smartLink.description}</p>` : ''}
      
      <div class="platforms">
        ${streamingPlatforms.map(platform => `
          <a href="${platform.url}" target="_blank" rel="noopener noreferrer" class="platform-button">
            Listen on ${platform.platform_name}
          </a>
        `).join('')}
      </div>
      
      <div class="footer">
        <a href="https://soundraiser.io" target="_blank" rel="noopener noreferrer">
          <img src="${siteUrl}/lovable-uploads/soundraiser-logo/Iso A.svg" alt="Soundraiser" />
          <span>Powered by Soundraiser</span>
        </a>
      </div>
    </div>
    
    <div class="redirect-message">
      <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
      Loading interactive experience...
    </div>
  </body>
</html>`;

  console.log(`[Render Smart Link] HTML response generated successfully`);

  // Enhanced headers to aid troubleshooting and caching
  const responseHeaders = {
    ...corsHeaders,
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    'X-Content-Type-Options': 'nosniff',
    'X-Smart-Link-ID': smartLink.id,
    'X-Render-Source': 'Soundraiser Direct HTML',
    'X-Request-URL': requestUrl,
    'X-User-Agent': userAgent.substring(0, 100), // Truncate if very long
    'X-Is-Crawler': isCrawler.toString(),
    'X-Soundraiser-Version': '1.0.3', // Updated version for tracking response format changes
  };

  return new Response(html, { headers: responseHeaders });
}
