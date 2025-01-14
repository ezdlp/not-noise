import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import SpotifyWebApi from "spotify-web-api-node";

interface SearchStepProps {
  onNext: (trackData: any) => void;
}

const spotifyApi = new SpotifyWebApi();
spotifyApi.setClientId("0e9ee3ef0f2a499cb2e8151cdcdb87b8");
spotifyApi.setClientSecret("a4c7c2ec14564d9b94a5e8b18bd57931");

const SearchStep = ({ onNext }: SearchStepProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const extractSpotifyId = (url: string) => {
    const match = url.match(/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const fetchTrackById = async (trackId: string) => {
    try {
      setIsLoading(true);
      const data = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + btoa("0e9ee3ef0f2a499cb2e8151cdcdb87b8:a4c7c2ec14564d9b94a5e8b18bd57931"),
        },
        body: "grant_type=client_credentials",
      });
      
      const tokenResponse = await data.json();
      spotifyApi.setAccessToken(tokenResponse.access_token);

      const track = await spotifyApi.getTrack(trackId);
      
      if (!track.body) {
        toast.error("Track not found");
        return;
      }

      const trackData = {
        title: track.body.name,
        artist: track.body.artists.map(artist => artist.name).join(", "),
        album: track.body.album.name,
        artworkUrl: track.body.album.images[0]?.url,
        spotifyId: track.body.id,
        spotifyUrl: track.body.external_urls.spotify,
        releaseDate: track.body.album.release_date,
      };

      onNext(trackData);
    } catch (error) {
      console.error("Error fetching track:", error);
      toast.error("Failed to fetch track. Please try searching instead.");
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsLoading(true);
      const data = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + btoa("0e9ee3ef0f2a499cb2e8151cdcdb87b8:a4c7c2ec14564d9b94a5e8b18bd57931"),
        },
        body: "grant_type=client_credentials",
      });
      
      const tokenResponse = await data.json();
      spotifyApi.setAccessToken(tokenResponse.access_token);

      const searchResults = await spotifyApi.searchTracks(query, { limit: 10 });
      
      if (searchResults.body.tracks?.items.length === 0) {
        toast.error("No tracks found. Please try a different search term.");
        setSearchResults([]);
        return;
      }

      const tracks = searchResults.body.tracks?.items.map(track => ({
        title: track.name,
        artist: track.artists.map(artist => artist.name).join(", "),
        album: track.album.name,
        artworkUrl: track.album.images[0]?.url,
        spotifyId: track.id,
        spotifyUrl: track.external_urls.spotify,
        releaseDate: track.album.release_date,
        relevanceScore: calculateRelevanceScore(track, query),
      }));

      setSearchResults(tracks.sort((a, b) => b.relevanceScore - a.relevanceScore));
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search for tracks. Please try again.");
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRelevanceScore = (track: any, query: string) => {
    const queryLower = query.toLowerCase();
    const titleMatch = track.name.toLowerCase().includes(queryLower) ? 2 : 0;
    const artistMatch = track.artists.some((artist: any) => 
      artist.name.toLowerCase().includes(queryLower)
    ) ? 1 : 0;
    return titleMatch + artistMatch;
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // Check if it's a Spotify URL first
    const trackId = extractSpotifyId(value);
    if (trackId) {
      fetchTrackById(trackId);
      return;
    }
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      performSearch(value);
    }, 2000);

    setSearchTimeout(timeout);
  };

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const handleSelectTrack = async (track: any) => {
    setIsLoading(true);
    onNext({
      ...track,
      artworkUrl: track.artworkUrl || "/placeholder.svg",
    });
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Search Your Track</h2>
        <p className="text-sm text-muted-foreground">
          Search for your track or paste a Spotify URL
        </p>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Search by track name, artist or paste Spotify URL..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1 focus:ring-primary focus:border-primary"
          disabled={isLoading}
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Searching...</span>
        </div>
      )}

      <div className="space-y-4">
        {searchResults.map((track) => (
          <Card key={track.spotifyId} className="p-4">
            <div className="flex items-center gap-4">
              <img 
                src={track.artworkUrl || "/placeholder.svg"} 
                alt={`${track.title} cover`} 
                className="w-24 h-24 object-cover rounded-lg"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  console.error("Failed to load search result artwork:", track.artworkUrl);
                  img.src = "/placeholder.svg";
                }}
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{track.title}</h3>
                <p className="text-muted-foreground">{track.artist}</p>
                <p className="text-sm text-muted-foreground mt-1">{track.album}</p>
                <Button onClick={() => handleSelectTrack(track)} className="mt-4">
                  Use This Track
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SearchStep;