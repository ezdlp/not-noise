
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
    
    // Check if this is a crawler
    const isCrawler = /facebook|twitter|linkedin|pinterest|whatsapp|telegram|discord|bot|crawl|spider|google|bing|yahoo|facebookexternalhit|facebot|instapaper|flipboard|tumblr|slackbot|skype|snapchat|pinterest|yandex/i.test(userAgent);
    console.log(`[Render Smart Link] Is crawler: ${isCrawler}`);
    
    // Log all headers for debugging
    console.log(`[Render Smart Link] All headers:`, Object.fromEntries([...req.headers.entries()]));
    
    // Extract slug from path - handle different formats
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

  // Generate HTML with the proper meta tags
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
    
    <!-- Redirection script -->
    <script>
      // Only redirect browsers, not bots
      if (!/bot|facebook|twitter|linkedin|pinterest|whatsapp|telegram|discord|crawl|spider|google|bing|yahoo|facebookexternalhit|facebot|instapaper|flipboard|tumblr|slackbot|skype|snapchat|pinterest|yandex/i.test(navigator.userAgent)) {
        window.location.href = "/link/${smartLink.id}";
      }
    </script>
  </head>
  <body>
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; text-align: center; padding: 20px; font-family: system-ui, -apple-system, sans-serif;">
      <img src="${smartLink.artwork_url}" alt="${smartLink.title}" style="max-width: 300px; border-radius: 8px; margin-bottom: 20px;" />
      <h1 style="margin: 0; font-size: 24px; color: #333;">${smartLink.title}</h1>
      <h2 style="margin: 10px 0 20px; font-size: 18px; color: #555; font-weight: normal;">by ${smartLink.artist_name}</h2>
      <p style="max-width: 600px; margin-bottom: 30px; color: #666;">${description}</p>
      
      <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; max-width: 600px;">
        ${streamingPlatforms.map(platform => `
          <a href="${platform.url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 10px 20px; background-color: #6851FB; color: white; text-decoration: none; border-radius: 4px; font-weight: 500;">
            Listen on ${platform.platform_name}
          </a>
        `).join('')}
      </div>
      
      <p style="margin-top: 40px; font-size: 14px; color: #999;">
        If you are not redirected automatically, <a href="/link/${smartLink.id}" style="color: #6851FB; text-decoration: none;">click here</a> to view the music.
      </p>
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
    'X-Render-Source': 'Soundraiser Edge Function',
    'X-Request-URL': requestUrl,
    'X-User-Agent': userAgent.substring(0, 100) // Truncate if very long
  };

  return new Response(html, { headers: responseHeaders });
}
