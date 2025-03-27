
import { NextApiRequest, NextApiResponse } from 'next';
import SpotifyWebApi from 'spotify-web-api-node';

// Initialize the Spotify API with client credentials
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

// Token refresh logic
let tokenExpirationTime = 0;

async function refreshToken() {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body.access_token);
    tokenExpirationTime = Date.now() + (data.body.expires_in * 1000) - 60000; // Expire 1 minute early to be safe
    return true;
  } catch (error) {
    console.error('Error refreshing Spotify token:', error);
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check if token needs refreshing
    if (Date.now() > tokenExpirationTime) {
      const success = await refreshToken();
      if (!success) {
        return res.status(500).json({ error: 'Failed to authenticate with Spotify' });
      }
    }

    const { query, type = 'track' } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // Perform the search
    const response = await spotifyApi.search(
      query as string, 
      [type as string] as ('album' | 'artist' | 'playlist' | 'track')[]
    );

    return res.status(200).json(response.body);
  } catch (error) {
    console.error('Error searching Spotify:', error);
    return res.status(500).json({ error: 'Failed to search Spotify' });
  }
}
