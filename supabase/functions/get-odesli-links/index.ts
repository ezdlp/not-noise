import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Hello from get-odesli-links!')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

    const response = await fetch(`https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(url)}`)
    const data = await response.json()

    // Map platform IDs to match our frontend expectations
    const platformMapping = {
      spotify: 'spotify',
      appleMusic: 'apple',
      youtubeMusic: 'youtube_music',
      youtube: 'youtube',
      amazonMusic: 'amazon',
      deezer: 'deezer',
      tidal: 'tidal',
      soundcloud: 'soundcloud',
      itunes: 'itunes'
    }

    const linksByPlatform = {}
    for (const [platform, link] of Object.entries(data.linksByPlatform)) {
      const mappedPlatform = platformMapping[platform]
      if (mappedPlatform) {
        linksByPlatform[mappedPlatform] = link
      }
    }

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