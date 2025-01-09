import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import SpotifyWebApi from "spotify-web-api-node";

interface SearchStepProps {
  onNext: (trackData: any) => void;
}

// Initialize the Spotify API client
const spotifyApi = new SpotifyWebApi();
spotifyApi.setClientId("0e9ee3ef0f2a499cb2e8151cdcdb87b8");
spotifyApi.setClientSecret("a4c7c2ec14564d9b94a5e8b18bd57931");

const SearchStep = ({ onNext }: SearchStepProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [foundTrack, setFoundTrack] = useState<any>(null);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    
    try {
      setIsLoading(true);

      // Get access token using client credentials
      const data = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + btoa("0e9ee3ef0f2a499cb2e8151cdcdb87b8:a4c7c2ec14564d9b94a5e8b18bd57931"),
        },
        body: "grant_type=client_credentials",
      });
      
      const tokenResponse = await data.json();
      
      // Set the access token
      spotifyApi.setAccessToken(tokenResponse.access_token);

      // Search for tracks
      const searchResults = await spotifyApi.searchTracks(query, { limit: 1 });
      
      if (searchResults.body.tracks?.items.length === 0) {
        toast.error("No tracks found. Please try a different search term.");
        return;
      }

      const track = searchResults.body.tracks?.items[0];
      const trackData = {
        title: track.name,
        artist: track.artists.map(artist => artist.name).join(", "),
        album: track.album.name,
        coverUrl: track.album.images[0]?.url || "/placeholder.svg",
        spotifyId: track.id,
        spotifyUrl: track.external_urls.spotify,
      };

      setFoundTrack(trackData);
      toast.success("Track found!");
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search for tracks. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input changes with debounce
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // Clear any existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for the search
    const timeout = setTimeout(() => {
      performSearch(value);
    }, 500); // 500ms debounce

    setSearchTimeout(timeout);
  };

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const handleNext = () => {
    if (foundTrack) {
      onNext(foundTrack);
    }
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
        <Button disabled={!searchQuery.trim() || isLoading}>
          <Search className="mr-2 h-4 w-4" />
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </div>

      {foundTrack && (
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <img 
              src={foundTrack.coverUrl} 
              alt={`${foundTrack.title} cover`} 
              className="w-24 h-24 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{foundTrack.title}</h3>
              <p className="text-muted-foreground">{foundTrack.artist}</p>
              <p className="text-sm text-muted-foreground mt-1">{foundTrack.album}</p>
              <Button onClick={handleNext} className="mt-4">
                Use This Track
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SearchStep;