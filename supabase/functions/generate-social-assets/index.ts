import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    })
  }

  try {
    // Parse request body
    const { smartLinkId, platform, artworkUrl, title, artistName } = await req.json()
    
    if (!smartLinkId || !platform || !artworkUrl || !title || !artistName) {
      throw new Error('Missing required parameters')
    }

    console.log('Generating asset for:', { smartLinkId, platform, artworkUrl, title, artistName })

    // Launch browser with minimal permissions
    const browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process',
        '--disable-gpu'
      ]
    })
    
    const page = await browser.newPage()

    // Set viewport to match desired image dimensions
    await page.setViewport({ width: 1200, height: 630 })

    // Create HTML content
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
          <style>
            body { margin: 0; padding: 0; }
          </style>
        </head>
        <body>
          <div class="relative w-[1200px] h-[630px] overflow-hidden bg-black font-['DM_Sans']">
            <div 
              class="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style="background-image: url('${artworkUrl}'); filter: blur(30px) brightness(0.7); transform: scale(1.1);"
            ></div>
            
            <div class="relative h-full flex flex-col items-center justify-center p-12 z-10">
              <h2 class="text-4xl font-bold text-white mb-8 text-center">${artistName}</h2>
              
              <img 
                src="${artworkUrl}"
                alt="${title} cover"
                class="w-80 h-80 object-cover rounded-2xl shadow-2xl mb-8"
              />
              
              <h1 class="text-5xl font-bold text-white mb-12 text-center">${title}</h1>
              
              <div class="flex items-center justify-center gap-6">
                <img 
                  src="https://owtufhdsuuyrgmxytclj.supabase.co/storage/v1/object/public/media-library/spotify.png"
                  alt="Spotify"
                  class="w-12 h-12 object-contain brightness-0 invert"
                />
                <img 
                  src="https://owtufhdsuuyrgmxytclj.supabase.co/storage/v1/object/public/media-library/applemusic.png"
                  alt="Apple Music"
                  class="w-12 h-12 object-contain brightness-0 invert"
                />
                <img 
                  src="https://owtufhdsuuyrgmxytclj.supabase.co/storage/v1/object/public/media-library/youtubemusic.png"
                  alt="YouTube Music"
                  class="w-12 h-12 object-contain brightness-0 invert"
                />
              </div>
              
              <div class="absolute bottom-8 left-0 right-0 text-center">
                <p class="text-white/60 text-lg">Listen Now on notnoise</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    // Set content and wait for images to load
    await page.setContent(html, { waitUntil: 'networkidle0' })

    // Take screenshot
    const screenshot = await page.screenshot({ 
      type: 'png',
      encoding: 'binary',
      captureBeyondViewport: false
    })

    // Close browser
    await browser.close()

    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate a unique filename
    const timestamp = new Date().getTime()
    const filename = `${smartLinkId}-${platform}-${timestamp}.png`
    const filePath = `${smartLinkId}/${filename}`

    console.log('Uploading to storage...')

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('social-media-assets')
      .upload(filePath, screenshot, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error('Failed to upload generated asset')
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin
      .storage
      .from('social-media-assets')
      .getPublicUrl(filePath)

    console.log('Asset generated successfully:', publicUrl)

    // Store asset record in database
    const { error: dbError } = await supabaseAdmin
      .from('social_media_assets')
      .insert({
        smart_link_id: smartLinkId,
        platform,
        image_url: publicUrl
      })

    if (dbError) {
      console.error('Database error:', dbError)
      // Don't throw here, as we still want to return the URL
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl: publicUrl
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})