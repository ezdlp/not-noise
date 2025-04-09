
// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.com/manual/examples/deploy_api
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

// Initialize Supabase client with environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

const SITE_URL = Deno.env.get('SITE_URL') || 'https://soundraiser.io'

interface StreamingPlatform {
  name: string
  url: string
}

Deno.serve(async (req) => {
  const userAgent = req.headers.get('user-agent') || 'No User-Agent'
  console.log(`Received request with User-Agent: ${userAgent}`)
  
  // Enhanced WhatsApp detection - WhatsApp uses various UA strings
  const isWhatsApp = userAgent.includes('WhatsApp') || 
                      userAgent.toLowerCase().includes('whatsapp') ||
                      /WhatsApp\/[0-9\.]+ [AIN]/.test(userAgent)
  
  if (isWhatsApp) {
    console.log('WhatsApp crawler detected! Full User-Agent:', userAgent)
    
    // Check if request includes the Accept-Language header that WhatsApp sends
    const acceptLanguage = req.headers.get('accept-language')
    if (acceptLanguage) {
      console.log('WhatsApp Accept-Language:', acceptLanguage)
    }
  }
  
  // Log all headers for debugging
  const headersLog: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    headersLog[key] = value
  })
  console.log('Request headers:', JSON.stringify(headersLog))

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    })
  }

  try {
    // Get the slug from the URL
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const slug = pathParts[pathParts.length - 1]

    console.log(`Processing SEO request for smart link: ${slug}`)

    if (!slug) {
      return new Response('Not Found: Missing slug parameter', { status: 404 })
    }

    // Fetch the smart link data from Supabase
    const { data: smartLink, error } = await supabase
      .from('smart_links')
      .select(`
        *,
        platform_links (
          id,
          platform_id,
          platform_name,
          url
        ),
        profiles:user_id (
          hide_branding
        )
      `)
      .eq('slug', slug)
      .maybeSingle()

    // If no results from slug, try with ID as fallback
    let finalSmartLink = smartLink
    if (!smartLink && !error) {
      const { data: idData, error: idError } = await supabase
        .from('smart_links')
        .select(`
          *,
          platform_links (
            id,
            platform_id,
            platform_name,
            url
          ),
          profiles:user_id (
            hide_branding
          )
        `)
        .eq('id', slug)
        .maybeSingle()

      if (idError) {
        console.error('Error fetching smart link by ID:', idError)
        return new Response('Not Found', { status: 404 })
      }

      finalSmartLink = idData
    } else if (error) {
      console.error('Error fetching smart link:', error)
      return new Response('Server Error', { status: 500 })
    }

    if (!finalSmartLink) {
      return new Response('Not Found', { status: 404 })
    }

    // Track the view in analytics (optional)
    try {
      await supabase.from('link_views').insert({
        smart_link_id: finalSmartLink.id,
        user_agent: userAgent,
      })
    } catch (analyticsError) {
      console.error('Failed to track analytics:', analyticsError)
      // Continue even if analytics fails
    }

    // Format the streaming platforms for schema markup
    const streamingPlatforms: StreamingPlatform[] = finalSmartLink.platform_links?.map((pl: any) => ({
      name: pl.platform_name,
      url: pl.url
    })) || []

    // Generate the full HTML page with proper meta tags and schema markup
    // Optimize for social sharing and search engines
    const fullTitle = `${finalSmartLink.title} by ${finalSmartLink.artist_name} | Listen on All Platforms`
    const description = finalSmartLink.description || `Stream or download ${finalSmartLink.title} by ${finalSmartLink.artist_name}. Available on Spotify, Apple Music, and more streaming platforms.`
    const canonicalUrl = `${SITE_URL}/link/${slug}`
    
    // Ensure artwork URL is absolute
    const artworkUrl = finalSmartLink.artwork_url.startsWith('http') 
      ? finalSmartLink.artwork_url 
      : `${SITE_URL}${finalSmartLink.artwork_url.startsWith('/') ? '' : '/'}${finalSmartLink.artwork_url}`

    // Build platform links list for display
    const platformLinksList = streamingPlatforms
      .map(platform => `<li><a href="${platform.url}" target="_blank" rel="noopener noreferrer">${platform.name}</a></li>`)
      .join('')

    // Schema.org structured data
    const schemaData = {
      '@context': 'https://schema.org',
      '@type': 'MusicRecording',
      'name': finalSmartLink.title,
      'byArtist': {
        '@type': 'MusicGroup',
        'name': finalSmartLink.artist_name,
      },
      'image': artworkUrl,
      'description': description,
      'url': canonicalUrl,
      ...(finalSmartLink.release_date && { 'datePublished': finalSmartLink.release_date }),
      'potentialAction': streamingPlatforms.map(platform => ({
        '@type': 'ListenAction',
        'target': {
          '@type': 'EntryPoint',
          'urlTemplate': platform.url
        },
        'expectsAcceptanceOf': {
          '@type': 'Offer',
          'name': `${finalSmartLink.title} on ${platform.name}`
        }
      }))
    }

    // Complete HTML with Meta Tags optimized for social sharing
    // Different optimizations for WhatsApp vs other social media
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fullTitle}</title>
  ${isWhatsApp ? `
  <!-- WhatsApp optimization: Critical OG tags first -->
  <meta property="og:site_name" content="Soundraiser">
  <meta property="og:title" content="${finalSmartLink.title} by ${finalSmartLink.artist_name}">
  <meta property="og:description" content="${description.substring(0, 100)}...">
  <meta property="og:image" content="${artworkUrl}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:type" content="music.song">` : ''}
  
  <!-- Basic Meta -->
  <meta name="description" content="${description}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:title" content="${fullTitle}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${artworkUrl}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:type" content="music.song">
  <meta property="og:site_name" content="Soundraiser">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${finalSmartLink.title} by ${finalSmartLink.artist_name}">
  <meta property="og:image:secure_url" content="${artworkUrl}">
  <meta property="og:locale" content="en_US">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${fullTitle}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${artworkUrl}">
  
  <!-- Music specific -->
  <meta property="music:musician" content="${SITE_URL}/artist/${encodeURIComponent(finalSmartLink.artist_name)}">
  <meta property="music:song" content="${canonicalUrl}">
  
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Structured Data -->
  <script type="application/ld+json">${JSON.stringify(schemaData)}</script>
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: #f5f5f5;
      color: #333;
      line-height: 1.5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      margin-top: 40px;
    }
    .artwork {
      width: 100%;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    h1 {
      font-size: 24px;
      margin-bottom: 5px;
    }
    .artist {
      color: #666;
      margin-bottom: 20px;
      font-size: 18px;
    }
    .description {
      margin-bottom: 20px;
      font-size: 16px;
    }
    .cta {
      display: block;
      background: #6851FB;
      color: white;
      text-align: center;
      padding: 12px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: bold;
      margin-bottom: 20px;
    }
    .platforms {
      list-style: none;
      padding: 0;
    }
    .platforms li {
      margin-bottom: 8px;
    }
    .platforms a {
      color: #6851FB;
      text-decoration: none;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      color: #999;
      font-size: 14px;
    }
    .footer a {
      color: #6851FB;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <img class="artwork" src="${artworkUrl}" alt="${finalSmartLink.title} by ${finalSmartLink.artist_name}" />
    <h1>${finalSmartLink.title}</h1>
    <div class="artist">by ${finalSmartLink.artist_name}</div>
    <div class="description">${description}</div>
    
    <a href="${canonicalUrl}" class="cta">Listen Now</a>
    
    <h2>Available on:</h2>
    <ul class="platforms">
      ${platformLinksList}
    </ul>
    
    <div class="footer">
      <p>
        <a href="${SITE_URL}">Powered by Soundraiser</a>
      </p>
    </div>
  </div>

  <script>
    // If JavaScript is enabled, redirect to the actual Smart Link
    window.location.href = "${canonicalUrl}";
  </script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    console.error('Error in smart-link-seo function:', error)
    return new Response(`Internal Server Error: ${error.message}`, {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain'
      }
    })
  }
})
