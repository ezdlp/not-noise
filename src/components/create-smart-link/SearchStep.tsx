
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Music, ListMusic, Disc } from "lucide-react";
import { Card } from "@/components/ui/card";
import debounce from 'lodash/debounce';

interface SearchStepProps {
  onNext: (data: any) => void;
}

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  artworkUrl: string;
  content_type: 'track' | 'album' | 'playlist';
  spotifyUrl: string;
  albumName?: string;
  releaseDate?: string;
  totalTracks?: number;
  albumType?: string;
}

const SearchStep = ({ onNext }: SearchStepProps) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contentType, setContentType] = useState<'track' | 'album' | 'playlist' | null>(null);
  const [searchResults, setSearchResults] = useState<{ tracks: SearchResult[], albums: SearchResult[] } | null>(null);
  const [isUrlMode, setIsUrlMode] = useState(false);

  useEffect(() => {
    if (input.includes("spotify.com")) {
      setIsUrlMode(true);
      if (input.includes("/playlist/")) {
        setContentType('playlist');
      } else if (input.includes("/album/")) {
        setContentType('album');
      } else if (input.includes("/track/")) {
        setContentType('track');
      } else {
        setContentType(null);
      }
      setSearchResults(null);
    } else {
      setIsUrlMode(false);
      setContentType(null);
      if (input.trim()) {
        handleSearch(input);
      } else {
        setSearchResults(null);
      }
    }
  }, [input]);

  const handleSearch = debounce(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("spotify-search", {
        body: { query: searchQuery }
      });

      if (error) throw error;
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching:", error);
      toast.error("Failed to search. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, 500);

  const handleUrlSubmit = async () => {
    if (!input.includes("spotify.com")) {
      toast.error("Please enter a valid Spotify URL");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("spotify-search", {
        body: { url: input }
      });

      if (error) throw error;
      if (!data) throw new Error("No data returned from Spotify");

      onNext(data);
    } catch (error) {
      console.error("Error fetching from URL:", error);
      toast.error("Failed to fetch content information. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultSelect = (result: SearchResult) => {
    onNext({
      ...result,
      content_type: result.content_type
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg sm:text-xl font-semibold">Find Your Music</h2>
        <p className="text-sm text-muted-foreground">
          Search for your music or paste a Spotify URL
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="search-input">Search or paste Spotify URL</Label>
          <div className="space-y-2">
            <Input
              id="search-input"
              placeholder="Search by title/artist or paste Spotify URL..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="h-10"
            />
            {contentType && (
              <Badge 
                variant="secondary" 
                className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                {contentType === 'playlist' ? (
                  <ListMusic className="w-3 h-3 mr-1" />
                ) : contentType === 'album' ? (
                  <Disc className="w-3 h-3 mr-1" />
                ) : (
                  <Music className="w-3 h-3 mr-1" />
                )}
                {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
              </Badge>
            )}
          </div>
        </div>

        {!isUrlMode && searchResults && (
          <div className="space-y-4">
            {searchResults.tracks.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Tracks</h3>
                <div className="space-y-2">
                  {searchResults.tracks.slice(0, 5).map((track) => (
                    <Card key={track.id} className="p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <img src={track.artworkUrl} alt={track.title} className="w-16 h-16 rounded-md object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{track.title}</p>
                          <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                          <p className="text-xs text-muted-foreground truncate">{track.albumName}</p>
                        </div>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => handleResultSelect(track)}
                        >
                          Select
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {searchResults.albums.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Albums & EPs</h3>
                <div className="space-y-2">
                  {searchResults.albums.slice(0, 5).map((album) => (
                    <Card key={album.id} className="p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <img src={album.artworkUrl} alt={album.title} className="w-16 h-16 rounded-md object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{album.title}</p>
                          <p className="text-sm text-muted-foreground truncate">{album.artist}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {album.albumType === 'single' ? 'EP/Single' : 'Album'} • {album.totalTracks} tracks
                          </p>
                        </div>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => handleResultSelect(album)}
                        >
                          Select
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {isUrlMode && (
          <Button
            onClick={handleUrlSubmit}
            disabled={isLoading || !contentType}
            className="w-full"
          >
            {isLoading ? "Loading..." : "Continue"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default SearchStep;
