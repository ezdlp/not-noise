
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID')
const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET')

async function getSpotifyAccessToken() {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
    },
    body: 'grant_type=client_credentials',
  })

  const data = await response.json()
  return data.access_token
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Parse request body
    const requestData = await req.json()
    console.log('Request data:', requestData)

    // Handle both formats: direct query and body.query
    const searchQuery = requestData.query || (requestData.body && requestData.body.query)
    const spotifyUrl = requestData.url || (requestData.body && requestData.body.url)

    // Validate input
    if (!searchQuery && !spotifyUrl) {
      console.error('No query or URL provided')
      return new Response(
        JSON.stringify({ error: 'No query or URL provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing search query: ${searchQuery || spotifyUrl}\n`)

    const accessToken = await getSpotifyAccessToken()

    let endpoint
    let params = new URLSearchParams()

    if (spotifyUrl) {
      const id = spotifyUrl.split('/').pop()?.split('?')[0]
      endpoint = `https://api.spotify.com/v1/tracks/${id}`
    } else {
      endpoint = 'https://api.spotify.com/v1/search'
      params.append('q', searchQuery)
      params.append('type', 'track,album')
      params.append('limit', '10')
    }

    const searchResponse = await fetch(`${endpoint}${params.toString() ? '?' + params.toString() : ''}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const searchData = await searchResponse.json()
    console.log('Search successful')

    return new Response(
      JSON.stringify(searchData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
