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
        coverUrl: track.album.images[0]?.url || "/placeholder.svg",
        spotifyId: track.id,
        spotifyUrl: track.external_urls.spotify,
        releaseDate: track.album.release_date,
        relevanceScore: calculateRelevanceScore(track, query),
      }));

      // Sort by relevance score
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

  const handleSelectTrack = (track: any) => {
    onNext(track);
    toast.success("Track selected!", {
      position: "top-center",
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Search Your Track</h2>
        <p className="text-sm text-muted-foreground">
          Search for your track on Spotify to get started
        </p>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Search by track name or artist..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1"
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
                src={track.coverUrl} 
                alt={`${track.title} cover`} 
                className="w-24 h-24 object-cover rounded-lg"
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