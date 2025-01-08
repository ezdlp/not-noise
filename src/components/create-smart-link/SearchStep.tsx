import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";
import SpotifyWebApi from "spotify-web-api-node";

interface SearchStepProps {
  onNext: (trackData: any) => void;
}

const spotifyApi = new SpotifyWebApi({
  clientId: "0e9ee3ef0f2a499cb2e8151cdcdb87b8",
  clientSecret: "a4c7c2ec14564d9b94a5e8b18bd57931",
});

const SearchStep = ({ onNext }: SearchStepProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    try {
      setIsLoading(true);

      // Get access token
      const authResponse = await spotifyApi.clientCredentialsGrant();
      spotifyApi.setAccessToken(authResponse.body.access_token);

      // Search for tracks
      const searchResults = await spotifyApi.searchTracks(searchQuery, { limit: 1 });
      
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

      toast.success("Track found!");
      onNext(trackData);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search for tracks. Please try again.");
    } finally {
      setIsLoading(false);
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
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />
        <Button 
          onClick={handleSearch} 
          disabled={!searchQuery.trim() || isLoading}
        >
          <Search className="mr-2 h-4 w-4" />
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </div>
    </div>
  );
};

export default SearchStep;