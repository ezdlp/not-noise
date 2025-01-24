import { useQuery } from "@tanstack/react-query";
import SpotifyWebApi from "spotify-web-api-node";

const spotifyApi = new SpotifyWebApi({
  clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
  clientSecret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET,
});

export function useSpotifyPopularity(links: any[]) {
  return useQuery({
    queryKey: ["spotify-popularity", links],
    queryFn: async () => {
      try {
        // Get client credentials token
        const authResponse = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(authResponse.body.access_token);

        // Extract Spotify track IDs from links
        const popularityScores: Record<string, number> = {};

        for (const link of links) {
          const spotifyLink = link.platform_links?.find(
            (pl: any) => pl.platform_name === "Spotify"
          );
          if (spotifyLink) {
            const trackId = spotifyLink.url.split("/track/")[1]?.split("?")[0];
            if (trackId) {
              try {
                const track = await spotifyApi.getTrack(trackId);
                popularityScores[link.id] = track.body.popularity;
              } catch (error) {
                console.error(`Error fetching track ${trackId}:`, error);
              }
            }
          }
        }

        return popularityScores;
      } catch (error) {
        console.error("Error in Spotify popularity query:", error);
        return {};
      }
    },
    enabled: links.length > 0,
  });
}