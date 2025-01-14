import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    
    if (!url) {
      throw new Error('URL is required')
    }

    console.log('Fetching links for URL:', url)

    // Make a request to the Odesli API
    const response = await fetch('https://api.song.link/v1-alpha.1/links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    })

    if (!response.ok) {
      console.error('Odesli API error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      throw new Error(`Odesli API error: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Odesli API response:', data)

    // Map platform IDs to match our frontend expectations
    const platformMapping = {
      spotify: 'spotify',
      appleMusic: 'apple',
      youtubeMusic: 'youtube_music',
      youtube: 'youtube',
      amazonMusic: 'amazon',
      deezer: 'deezer',
      soundcloud: 'soundcloud',
      itunes: 'itunes',
      tidal: 'tidal',
      napster: 'napster',
      yandex: 'yandex',
      audiomack: 'audiomack',
      audius: 'audius',
      boomplay: 'boomplay',
      anghami: 'anghami'
    }

    // Process the response to match our frontend's expected format
    const linksByPlatform = {}
    
    if (data.linksByPlatform) {
      for (const [platform, linkData] of Object.entries(data.linksByPlatform)) {
        const mappedPlatform = platformMapping[platform]
        if (mappedPlatform) {
          linksByPlatform[mappedPlatform] = {
            url: linkData.url,
            entityUniqueId: linkData.entityUniqueId
          }
        }
      }
    }

    console.log('Processed links:', linksByPlatform)

    return new Response(
      JSON.stringify({ 
        linksByPlatform,
        pageUrl: data.pageUrl,
        entitiesByUniqueId: data.entitiesByUniqueId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})