
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';

// Spotify API base URL
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// Define a simple interface for Spotify credentials
interface SpotifyCredentials {
  client_id: string;
  client_secret: string;
}

// Define the expected shape of config_value
type ConfigValue = string | Record<string, unknown>;

/**
 * Get a Spotify API token using client credentials
 * Note: In production, this token should be cached to avoid rate limits
 */
async function getSpotifyToken(): Promise<string> {
  try {
    // Get Spotify credentials from Supabase config
    const { data, error } = await supabase
      .from('app_config')
      .select('config_value')
      .eq('config_key', 'spotify_credentials')
      .single();

    if (error) throw error;
    
    // Parse the config_value which should be a JSON string
    const credentialsValue = data?.config_value as ConfigValue;
    let credentials: SpotifyCredentials;
    
    if (typeof credentialsValue === 'string') {
      try {
        credentials = JSON.parse(credentialsValue);
      } catch (e) {
        throw new Error('Invalid Spotify credentials format in app config');
      }
    } else if (typeof credentialsValue === 'object' && credentialsValue !== null) {
      // Safe type assertion after validation
      const tempCreds = credentialsValue;
      if (
        typeof tempCreds.client_id === 'string' && 
        typeof tempCreds.client_secret === 'string'
      ) {
        credentials = {
          client_id: tempCreds.client_id as string,
          client_secret: tempCreds.client_secret as string
        };
      } else {
        throw new Error('Invalid Spotify credentials structure in app config');
      }
    } else {
      throw new Error('Spotify credentials not found in app config');
    }
    
    if (!credentials?.client_id || !credentials?.client_secret) {
      throw new Error('Spotify credentials not found in app config');
    }

    // Base64 encode the client credentials
    const auth = Buffer.from(`${credentials.client_id}:${credentials.client_secret}`).toString('base64');
    
    // Request a token from Spotify
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const tokenData = await response.json();
    
    if (!response.ok) {
      throw new Error(`Spotify token error: ${tokenData.error}`);
    }

    return tokenData.access_token;
  } catch (error) {
    console.error('Error getting Spotify token:', error);
    throw new Error('Failed to authenticate with Spotify');
  }
}

/**
 * Search for tracks using the Spotify API
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Ensure user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get search query from request
    const query = req.query.query as string;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Get Spotify access token
    const token = await getSpotifyToken();

    // Search Spotify for tracks
    const response = await fetch(
      `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Spotify API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // Format the response data
    const tracks = data.tracks.items.map((track: any) => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map((a: any) => a.name).join(', '),
      albumCover: track.album.images[0]?.url || '',
      releaseDate: track.album.release_date,
      previewUrl: track.preview_url,
    }));

    return res.status(200).json({ tracks });
  } catch (error) {
    console.error('Spotify search error:', error);
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to search Spotify'
    });
  }
}
