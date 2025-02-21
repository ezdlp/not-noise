
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { serve } from 'https://deno.fresh.run/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

interface SpotifyTokenResponse {
  access_token: string
}

interface SpotifySearchParams {
  query?: string
  url?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const requestData: SpotifySearchParams = await req.json()
    console.log('Request data:', requestData)

    // Get Spotify access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${Deno.env.get('SPOTIFY_CLIENT_ID')}:${Deno.env.get('SPOTIFY_CLIENT_SECRET')}`)}`,
      },
      body: 'grant_type=client_credentials',
    })

    if (!tokenResponse.ok) {
      console.error('Failed to get Spotify token:', await tokenResponse.text())
      throw new Error('Failed to authenticate with Spotify')
    }

    const { access_token } = await tokenResponse.json() as SpotifyTokenResponse

    // Handle URL lookup
    if (requestData.url) {
      console.log('Processing Spotify URL:', requestData.url)
      const segments = requestData.url.split('/')
      const type = segments[segments.length - 2]
      const id = segments[segments.length - 1].split('?')[0]

      const spotifyResponse = await fetch(`https://api.spotify.com/v1/${type}s/${id}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })

      if (!spotifyResponse.ok) {
        console.error('Spotify API error:', await spotifyResponse.text())
        throw new Error('Failed to fetch from Spotify')
      }

      const data = await spotifyResponse.json()
      console.log('Spotify response for URL:', data)

      // Transform single item response
      const transformedData = {
        id: data.id,
        title: data.name,
        artist: data.type === 'track' ? data.artists[0].name : data.owner?.display_name || data.artists[0].name,
        artworkUrl: data.images?.[0]?.url || data.album?.images[0]?.url,
        content_type: data.type,
        spotifyUrl: data.external_urls.spotify,
        albumName: data.type === 'track' ? data.album.name : undefined,
        releaseDate: data.release_date,
        totalTracks: data.total_tracks,
        albumType: data.album_type
      }

      return new Response(JSON.stringify(transformedData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Handle search query
    if (requestData.query) {
      console.log('Processing search query:', requestData.query)
      const searchResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(requestData.query)}&type=track,album&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      )

      if (!searchResponse.ok) {
        console.error('Spotify search error:', await searchResponse.text())
        throw new Error('Failed to search Spotify')
      }

      const data = await searchResponse.json()
      console.log('Spotify search response:', data)

      // Transform search results
      const transformedData = {
        tracks: data.tracks.items.map((track: any) => ({
          id: track.id,
          title: track.name,
          artist: track.artists[0].name,
          artworkUrl: track.album.images[0].url,
          content_type: 'track',
          spotifyUrl: track.external_urls.spotify,
          albumName: track.album.name,
          releaseDate: track.album.release_date
        })),
        albums: data.albums.items.map((album: any) => ({
          id: album.id,
          title: album.name,
          artist: album.artists[0].name,
          artworkUrl: album.images[0].url,
          content_type: 'album',
          spotifyUrl: album.external_urls.spotify,
          totalTracks: album.total_tracks,
          albumType: album.album_type,
          releaseDate: album.release_date
        }))
      }

      return new Response(JSON.stringify(transformedData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw new Error('Either query or url parameter is required')

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred processing your request'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
