import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Hello from get-odesli-links!')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    console.log('Fetching links for URL:', url)

    // The Odesli API requires the URL to be properly encoded
    const encodedUrl = encodeURIComponent(url)
    const odesliApiUrl = `https://api.song.link/v1-alpha.1/links?url=${encodedUrl}`

    console.log('Calling Odesli API:', odesliApiUrl)
    const response = await fetch(odesliApiUrl)
    
    if (!response.ok) {
      console.error('Odesli API error:', response.statusText)
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
    
    // First, process the platformUrls from the API response
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
        status: 400,
      },
    )
  }
})