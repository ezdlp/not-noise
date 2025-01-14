import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    
    if (!url) {
      throw new Error('URL is required')
    }

    console.log('Fetching links for URL:', url)

    const response = await fetch(`https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Odesli API error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      throw new Error(`Odesli API error: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Odesli API response:', data)

    // Updated platform mapping with correct keys
    const platformMapping = {
      spotify: 'spotify',
      youtubeMusic: 'youtube_music',
      youtube: 'youtube',
      appleMusic: 'apple',
      amazonMusic: 'amazon',
      deezer: 'deezer',
      soundcloud: 'soundcloud',
      itunes: 'itunes',
      tidal: 'tidal',
      napster: 'napster',
      yandex: 'yandex',
      anghami: 'anghami'
    }

    const linksByPlatform = {}
    
    if (data.linksByPlatform) {
      Object.entries(data.linksByPlatform).forEach(([platform, linkData]) => {
        // Find the corresponding internal platform ID
        const internalPlatform = Object.entries(platformMapping).find(([_, apiKey]) => apiKey === platform)?.[0]
        
        if (internalPlatform) {
          linksByPlatform[internalPlatform] = {
            url: linkData.url,
            entityUniqueId: linkData.entityUniqueId
          }
        }
      })
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