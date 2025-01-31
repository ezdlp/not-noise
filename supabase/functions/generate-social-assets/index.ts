import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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

    // Generate a unique filename
    const timestamp = new Date().getTime()
    const filename = `${smartLinkId}-${platform}-${timestamp}.png`
    const filePath = `${smartLinkId}/${filename}`

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

    // Return the HTML content for client-side rendering
    return new Response(
      JSON.stringify({ 
        success: true,
        html: html,
        filePath: filePath
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