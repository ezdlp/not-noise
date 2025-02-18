
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID')
const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET')

// Detect if input is a Spotify URL and extract ID and type
const parseSpotifyUrl = (url: string) => {
  const urlObj = new URL(url);
  if (!urlObj.hostname.includes('spotify.com')) return null;

  const pathParts = urlObj.pathname.split('/');
  if (pathParts.length < 3) return null;

  const contentType = pathParts[1]; // 'track', 'album', or 'playlist'
  const id = pathParts[2];

  if (!['track', 'album', 'playlist'].includes(contentType)) return null;

  return { type: contentType, id };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { url, query } = await req.json()

    // Get Spotify access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
      },
      body: 'grant_type=client_credentials',
    })

    const { access_token } = await tokenResponse.json()

    // Handle URL input
    if (url) {
      console.log('Processing URL:', url)
      const urlInfo = parseSpotifyUrl(url)
      
      if (!urlInfo) {
        throw new Error('Invalid Spotify URL')
      }

      const endpoint = `https://api.spotify.com/v1/${urlInfo.type}s/${urlInfo.id}`
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${access_token}` },
      })

      const data = await response.json()
      if (data.error) {
        throw new Error(data.error.message)
      }

      // Format response based on content type
      const result = {
        title: data.name,
        artist: urlInfo.type === 'playlist' ? data.owner.display_name : data.artists[0].name,
        artworkUrl: data.images[0]?.url,
        content_type: urlInfo.type,
        spotifyUrl: url
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Handle search query
    if (query) {
      console.log('Processing search query:', query)
      const searchResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,album&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      )

      const searchData = await searchResponse.json()

      // Format search results
      const results = {
        tracks: searchData.tracks.items.map((track: any) => ({
          id: track.id,
          title: track.name,
          artist: track.artists[0].name,
          artworkUrl: track.album.images[0]?.url,
          content_type: 'track',
          albumName: track.album.name,
          spotifyUrl: track.external_urls.spotify
        })),
        albums: searchData.albums.items.map((album: any) => ({
          id: album.id,
          title: album.name,
          artist: album.artists[0].name,
          artworkUrl: album.images[0]?.url,
          content_type: 'album',
          releaseDate: album.release_date,
          totalTracks: album.total_tracks,
          albumType: album.album_type,
          spotifyUrl: album.external_urls.spotify
        }))
      }

      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Either url or query parameter is required')

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

