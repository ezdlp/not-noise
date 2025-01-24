import { useQuery } from "@tanstack/react-query";
import SpotifyWebApi from "spotify-web-api-node";
import { extractSpotifyTrackId } from "@/utils/spotify";

const spotifyApi = new SpotifyWebApi({
  clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
  clientSecret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET,
});

let accessToken: string | null = null;
let tokenExpirationTime: number | null = null;

const getAccessToken = async () => {
  if (accessToken && tokenExpirationTime && Date.now() < tokenExpirationTime) {
    return accessToken;
  }

  try {
    const data = await spotifyApi.clientCredentialsGrant();
    accessToken = data.body.access_token;
    tokenExpirationTime = Date.now() + (data.body.expires_in * 1000);
    spotifyApi.setAccessToken(accessToken);
    return accessToken;
  } catch (error) {
    console.error('Error getting Spotify access token:', error);
    throw error;
  }
};

export const useSpotifyPopularity = (links: any[]) => {
  return useQuery({
    queryKey: ['spotifyPopularity', links?.map(l => l.id)],
    queryFn: async () => {
      if (!links?.length) return {};

      try {
        await getAccessToken();
        
        const spotifyLinks = links.reduce((acc: Record<string, any>, link: any) => {
          const spotifyPlatformLink = link.platform_links?.find(
            (pl: any) => pl.platform_id === 'spotify'
          );
          
          if (spotifyPlatformLink) {
            const trackId = extractSpotifyTrackId(spotifyPlatformLink.url);
            if (trackId) {
              acc[link.id] = trackId;
            }
          }
          return acc;
        }, {});

        const trackIds = Object.values(spotifyLinks);
        if (!trackIds.length) return {};

        const tracks = await spotifyApi.getTracks(trackIds as string[]);
        
        return Object.entries(spotifyLinks).reduce((acc: Record<string, number>, [linkId, trackId]) => {
          const track = tracks.body.tracks.find(t => t.id === trackId);
          if (track) {
            acc[linkId] = track.popularity;
          }
          return acc;
        }, {});
      } catch (error) {
        console.error('Error fetching Spotify popularity:', error);
        return {};
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};