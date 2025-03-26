
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

// Setup CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Get Spotify access token
async function getSpotifyToken() {
  try {
    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
    const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      throw new Error('Missing Spotify credentials in environment variables');
    }

    const authString = encode(`${clientId}:${clientSecret}`);
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`Spotify token error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Token Error:', error.message);
    throw new Error(`Failed to get Spotify token: ${error.message}`);
  }
}

// Search Spotify API
async function searchSpotify(token, query) {
  try {
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,album&limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Spotify search error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Search Error:', error.message);
    throw new Error(`Failed to search Spotify: ${error.message}`);
  }
}

// Get Spotify item from URL
async function getSpotifyItemFromUrl(token, url) {
  try {
    // Extract Spotify ID and type from URL
    let spotifyId;
    let itemType;
    
    if (url.includes('/track/')) {
      itemType = 'track';
      spotifyId = url.split('/track/')[1].split('?')[0];
    } else if (url.includes('/album/')) {
      itemType = 'album';
      spotifyId = url.split('/album/')[1].split('?')[0];
    } else if (url.includes('/playlist/')) {
      itemType = 'playlist';
      spotifyId = url.split('/playlist/')[1].split('?')[0];
    } else if (url.startsWith('spotify:track:')) {
      itemType = 'track';
      spotifyId = url.split('spotify:track:')[1];
    } else if (url.startsWith('spotify:album:')) {
      itemType = 'album';
      spotifyId = url.split('spotify:album:')[1];
    } else if (url.startsWith('spotify:playlist:')) {
      itemType = 'playlist';
      spotifyId = url.split('spotify:playlist:')[1];
    } else if (/^[a-zA-Z0-9]{22}$/.test(url)) {
      // Assume it's a track ID if it's just a string of the right length
      itemType = 'track';
      spotifyId = url;
    } else {
      throw new Error('Invalid Spotify URL or ID format');
    }
    
    const endpoint = `https://api.spotify.com/v1/${itemType}s/${spotifyId}`;
    const response = await fetch(endpoint, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Spotify item fetch error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Format response based on item type
    if (itemType === 'track') {
      return {
        id: data.id,
        title: data.name,
        artist: data.artists[0]?.name || 'Unknown Artist',
        artistId: data.artists[0]?.id || '',
        artworkUrl: data.album?.images[0]?.url || '',
        content_type: 'track',
        spotifyUrl: data.external_urls?.spotify || url,
        albumName: data.album?.name,
        releaseDate: data.album?.release_date
      };
    } else if (itemType === 'album') {
      return {
        id: data.id,
        title: data.name,
        artist: data.artists[0]?.name || 'Unknown Artist',
        artistId: data.artists[0]?.id || '',
        artworkUrl: data.images[0]?.url || '',
        content_type: 'album',
        spotifyUrl: data.external_urls?.spotify || url,
        totalTracks: data.total_tracks,
        releaseDate: data.release_date,
        albumType: data.album_type
      };
    } else if (itemType === 'playlist') {
      return {
        id: data.id,
        title: data.name,
        artist: data.owner?.display_name || 'Unknown Creator',
        artistId: data.owner?.id || '',
        artworkUrl: data.images[0]?.url || '',
        content_type: 'playlist',
        spotifyUrl: data.external_urls?.spotify || url,
        totalTracks: data.tracks?.total,
        description: data.description
      };
    }
  } catch (error) {
    console.error('URL Lookup Error:', error.message);
    throw new Error(`Failed to get item from URL: ${error.message}`);
  }
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  try {
    const token = await getSpotifyToken();
    let body;
    
    try {
      body = await req.json();
      console.log("Request body:", JSON.stringify(body));
    } catch (error) {
      throw new Error(`Invalid request body: ${error.message}`);
    }
    
    let responseData;
    
    // URL lookup or search
    if (body.url) {
      console.log(`Processing URL lookup: ${body.url}`);
      responseData = await getSpotifyItemFromUrl(token, body.url);
      console.log(`URL lookup result:`, JSON.stringify(responseData));
    } else if (body.query) {
      console.log(`Processing search query: ${body.query}`);
      const searchData = await searchSpotify(token, body.query);
      
      // Safely transform search results with null checking and include artist IDs
      responseData = {
        tracks: Array.isArray(searchData.tracks?.items) ? searchData.tracks.items.map((track) => {
          const transformedTrack = {
            id: track.id,
            title: track.name,
            artist: track.artists?.[0]?.name || 'Unknown Artist',
            artistId: track.artists?.[0]?.id || '',
            artworkUrl: track.album?.images?.[0]?.url || '',
            content_type: 'track',
            spotifyUrl: track.external_urls?.spotify || '',
            albumName: track.album?.name || 'Unknown Album',
            releaseDate: track.album?.release_date
          };
          
          console.log(`Transformed track: ${JSON.stringify({
            id: transformedTrack.id,
            title: transformedTrack.title,
            artist: transformedTrack.artist,
            artistId: transformedTrack.artistId
          })}`);
          
          return transformedTrack;
        }) : [],
        albums: Array.isArray(searchData.albums?.items) ? searchData.albums.items.map((album) => ({
          id: album.id,
          title: album.name,
          artist: album.artists?.[0]?.name || 'Unknown Artist',
          artistId: album.artists?.[0]?.id || '',
          artworkUrl: album.images?.[0]?.url || '',
          content_type: 'album',
          spotifyUrl: album.external_urls?.spotify || '',
          albumType: album.album_type || 'album',
          totalTracks: album.total_tracks || 0,
          releaseDate: album.release_date
        })) : []
      };
      
      console.log(`Search found ${responseData.tracks.length} tracks and ${responseData.albums.length} albums`);
    } else {
      throw new Error('Missing url or query parameter');
    }
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in Spotify search function:', error.message);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unknown error occurred',
        details: error.stack || null
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
