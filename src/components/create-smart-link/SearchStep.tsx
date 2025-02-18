
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const ContentTypeCard = ({ 
  icon: Icon, 
  title, 
  methods 
}: { 
  icon: typeof Music; 
  title: string; 
  methods: string;
}) => (
  <div className="flex flex-col items-center p-4 border border-[#E6E6E6] rounded-lg bg-white">
    <Icon className="w-6 h-6 text-[#6851FB] mb-2" />
    <h3 className="font-medium text-sm mb-1">{title}</h3>
    <span className="text-xs text-[#6B7280]">{methods}</span>
  </div>
);

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
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Find Your Music
        </h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <ContentTypeCard 
          icon={Music} 
          title="Tracks" 
          methods="Search + URL"
        />
        <ContentTypeCard 
          icon={Disc} 
          title="Albums" 
          methods="Search + URL"
        />
        <ContentTypeCard 
          icon={Disc} 
          title="EPs/Singles" 
          methods="Search + URL"
        />
        <ContentTypeCard 
          icon={ListMusic} 
          title="Playlists" 
          methods="URL only"
        />
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <div className="relative">
            <Input
              placeholder="Search or paste Spotify URL"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="h-10 font-sans pr-24"
            />
            {contentType && (
              <Badge 
                variant="secondary" 
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#ECE9FF] text-[#6851FB] hover:bg-[#D0C7FF] transition-colors font-sans"
              >
                {contentType === 'playlist' ? (
                  <ListMusic className="w-3 h-3 mr-1.5" />
                ) : contentType === 'album' ? (
                  <Disc className="w-3 h-3 mr-1.5" />
                ) : (
                  <Music className="w-3 h-3 mr-1.5" />
                )}
                {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
              </Badge>
            )}
          </div>
        </div>

        {!isUrlMode && searchResults && (
          <div className="space-y-6">
            {searchResults.tracks.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-heading text-lg font-medium">Tracks</h3>
                <div className="space-y-3">
                  {searchResults.tracks.slice(0, 5).map((track) => (
                    <Card 
                      key={track.id} 
                      className="p-4 transition-all duration-200 hover:shadow-md border border-[#E6E6E6] hover:border-[#6851FB]/20"
                    >
                      <div className="flex items-center gap-4">
                        <img 
                          src={track.artworkUrl} 
                          alt={track.title} 
                          className="w-16 h-16 rounded-md object-cover shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-sans font-medium text-[#111827] truncate">
                            {track.title}
                          </p>
                          <p className="font-sans text-sm text-[#6B7280] truncate">
                            {track.artist}
                          </p>
                          <p className="font-sans text-xs text-[#9CA3AF] truncate">
                            {track.albumName}
                          </p>
                        </div>
                        <Button 
                          onClick={() => handleResultSelect(track)}
                          className="bg-white text-[#0F0F0F] hover:bg-[#F3F3F3] active:bg-[#E6E6E6] h-8 px-3 shadow-sm border border-[#E6E6E6]"
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
              <div className="space-y-3">
                <h3 className="font-heading text-lg font-medium">Albums & EPs</h3>
                <div className="space-y-3">
                  {searchResults.albums.slice(0, 5).map((album) => (
                    <Card 
                      key={album.id} 
                      className="p-4 transition-all duration-200 hover:shadow-md border border-[#E6E6E6] hover:border-[#6851FB]/20"
                    >
                      <div className="flex items-center gap-4">
                        <img 
                          src={album.artworkUrl} 
                          alt={album.title} 
                          className="w-16 h-16 rounded-md object-cover shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-sans font-medium text-[#111827] truncate">
                            {album.title}
                          </p>
                          <p className="font-sans text-sm text-[#6B7280] truncate">
                            {album.artist}
                          </p>
                          <p className="font-sans text-xs text-[#9CA3AF] truncate">
                            {album.albumType === 'single' ? 'EP/Single' : 'Album'} • {album.totalTracks} tracks
                          </p>
                        </div>
                        <Button 
                          onClick={() => handleResultSelect(album)}
                          className="bg-white text-[#0F0F0F] hover:bg-[#F3F3F3] active:bg-[#E6E6E6] h-8 px-3 shadow-sm border border-[#E6E6E6]"
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
            className="w-full bg-[#6851FB] hover:bg-[#4A47A5] active:bg-[#271153] disabled:bg-[#ECE9FF] h-10 px-4 text-white font-sans font-medium"
          >
            {isLoading ? "Loading..." : "Continue"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default SearchStep;

