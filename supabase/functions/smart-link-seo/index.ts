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
  
  // Enhanced WhatsApp detection logging
  if (userAgent.includes('WhatsApp') || userAgent.toLowerCase().includes('whatsapp')) {
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

    // Generate action buttons for schema markup
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
    }))

    // Create schema.org structured data
    const musicSchema = {
      "@context": "https://schema.org",
      "@type": "MusicRecording",
      "name": finalSmartLink.title,
      "byArtist": {
        "@type": "MusicGroup",
        "name": finalSmartLink.artist_name,
        "@id": `${SITE_URL}/artist/${encodeURIComponent(finalSmartLink.artist_name)}`
      },
      "image": finalSmartLink.artwork_url,
      "description": finalSmartLink.description,
      ...(finalSmartLink.release_date && { "datePublished": finalSmartLink.release_date }),
      "potentialAction": actionButtons,
      "url": `${SITE_URL}/link/${slug}`,
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
          "url": `${SITE_URL}/lovable-uploads/soundraiser-logo/Logo A.png`
        }
      }
    }

    // Create the full HTML with all required meta tags
    const fullTitle = `${finalSmartLink.title} by ${finalSmartLink.artist_name} | Listen on All Platforms`
    const finalDescription = finalSmartLink.description || 
      `Stream or download ${finalSmartLink.title} by ${finalSmartLink.artist_name}. Available on Spotify, Apple Music, and more streaming platforms.`
    
    const platformList = streamingPlatforms.map(platform => 
      `<li style="margin:8px 0;"><a href="${platform.url}" target="_blank" rel="noopener" style="color:#6851FB;text-decoration:none;font-weight:500;">${platform.name}</a></li>`
    ).join('')

    // Determine if this is a WhatsApp crawler
    const isWhatsApp = userAgent.includes('WhatsApp') || userAgent.toLowerCase().includes('whatsapp')
    
    // Create optimized HTML based on the crawler type
    let html
    
    if (isWhatsApp) {
      // Simplified HTML specifically for WhatsApp (focusing on requirements in the first 300KB)
      html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fullTitle}</title>
  
  <!-- WhatsApp optimized meta tags - must be in first 300KB -->
  <meta property="og:title" content="${fullTitle}">
  <meta property="og:description" content="${finalDescription}">
  <meta property="og:url" content="${SITE_URL}/link/${slug}">
  <meta property="og:image" content="${finalSmartLink.artwork_url}">
  <meta property="og:type" content="music.song">
  
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 0;
      background-color: #FAFAFA;
      color: #111827;
      line-height: 1.5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 32px 16px;
    }
    .card {
      background-color: white;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      padding: 24px;
      margin-bottom: 24px;
    }
    .header {
      display: flex;
      align-items: center;
      margin-bottom: 24px;
    }
    .artwork {
      width: 120px;
      height: 120px;
      border-radius: 8px;
      object-fit: cover;
      margin-right: 16px;
    }
    .title {
      font-size: 22px;
      font-weight: 600;
      margin: 0 0 4px 0;
    }
    .artist {
      font-size: 18px;
      color: #6B7280;
      margin: 0 0 12px 0;
    }
    .platforms {
      list-style-type: none;
      padding: 0;
      margin: 24px 0 0 0;
    }
    .button {
      display: inline-block;
      background-color: #6851FB;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 500;
      margin-top: 24px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <img src="${finalSmartLink.artwork_url}" alt="${finalSmartLink.title}" class="artwork">
        <div>
          <h1 class="title">${finalSmartLink.title}</h1>
          <p class="artist">by ${finalSmartLink.artist_name}</p>
        </div>
      </div>
      
      <h2>Available on:</h2>
      <ul class="platforms">
        ${platformList}
      </ul>
      
      <a href="${SITE_URL}/link/${slug}" class="button">Open Interactive Page</a>
    </div>
  </div>
</body>
</html>`
    } else {
      // Full HTML with all meta tags for other crawlers
      html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fullTitle}</title>
  
  <!-- Basic SEO -->
  <meta name="description" content="${finalDescription}">
  <link rel="canonical" href="${SITE_URL}/link/${slug}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="music.song">
  <meta property="og:title" content="${fullTitle}">
  <meta property="og:description" content="${finalDescription}">
  <meta property="og:image" content="${finalSmartLink.artwork_url}">
  <meta property="og:url" content="${SITE_URL}/link/${slug}">
  <meta property="og:site_name" content="Soundraiser">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${fullTitle}">
  ${finalSmartLink.release_date ? `<meta property="music:release_date" content="${finalSmartLink.release_date}">` : ''}
  ${streamingPlatforms.map(platform => `<meta property="music:musician" content="${platform.url}">`).join('\n  ')}
  
  <!-- WhatsApp specific -->
  <meta property="og:image:secure_url" content="${finalSmartLink.artwork_url}">
  <meta property="og:locale" content="en_US">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${fullTitle}">
  <meta name="twitter:description" content="${finalDescription}">
  <meta name="twitter:image" content="${finalSmartLink.artwork_url}">
  
  <!-- Schema.org structured data -->
  <script type="application/ld+json">
    ${JSON.stringify(musicSchema)}
  </script>

  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 0;
      background-color: #FAFAFA;
      color: #111827;
      line-height: 1.5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 32px 16px;
    }
    .card {
      background-color: white;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      padding: 24px;
      margin-bottom: 24px;
    }
    .header {
      display: flex;
      align-items: center;
      margin-bottom: 24px;
    }
    .artwork {
      width: 120px;
      height: 120px;
      border-radius: 8px;
      object-fit: cover;
      margin-right: 16px;
    }
    .title {
      font-size: 22px;
      font-weight: 600;
      margin: 0 0 4px 0;
    }
    .artist {
      font-size: 18px;
      color: #6B7280;
      margin: 0 0 12px 0;
    }
    .description {
      margin-top: 16px;
      color: #4B5563;
    }
    .platforms {
      list-style-type: none;
      padding: 0;
      margin: 24px 0 0 0;
    }
    .button {
      display: inline-block;
      background-color: #6851FB;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 500;
      margin-top: 24px;
      text-align: center;
    }
    .footer {
      text-align: center;
      color: #9CA3AF;
      font-size: 14px;
      margin-top: 32px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <img src="${finalSmartLink.artwork_url}" alt="${finalSmartLink.title}" class="artwork">
        <div>
          <h1 class="title">${finalSmartLink.title}</h1>
          <p class="artist">by ${finalSmartLink.artist_name}</p>
          ${finalSmartLink.description ? `<p class="description">${finalSmartLink.description}</p>` : ''}
        </div>
      </div>
      
      <h2>Available on:</h2>
      <ul class="platforms">
        ${platformList}
      </ul>
      
      <a href="${SITE_URL}/link/${slug}" class="button">Open Interactive Page</a>
    </div>
    
    ${!finalSmartLink.profiles?.hide_branding ? 
      `<div class="footer">
        Powered by <a href="${SITE_URL}" style="color:#6851FB;text-decoration:none;">Soundraiser</a>
      </div>` : ''}
  </div>
</body>
</html>`
    }

    // Record success in logs
    console.log(`Successfully generated SEO HTML for ${slug}`)

    // Return the HTML with proper headers
    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
      }
    })
  } catch (error) {
    console.error('Error in smart-link-seo function:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
})
