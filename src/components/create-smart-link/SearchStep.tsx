
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Music, ListMusic, Disc, Search } from "lucide-react";
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

const ContentTypeInfo = ({
  icon: Icon,
  title,
  methods
}: {
  icon: typeof Music;
  title: string;
  methods: string;
}) => (
  <div className="flex items-center gap-2">
    <Icon className="w-4 h-4 text-[#6851FB]" />
    <span className="font-medium text-sm text-[#374151]">{title}</span>
    <span className="text-xs text-[#6B7280] ml-1">({methods})</span>
  </div>
);

const SearchStep = ({ onNext }: SearchStepProps) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contentType, setContentType] = useState<'track' | 'album' | 'playlist' | null>(null);
  const [searchResults, setSearchResults] = useState<{
    tracks: SearchResult[];
    albums: SearchResult[];
  } | null>(null);
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
      console.log('Initiating search with query:', searchQuery);
      const { data, error } = await supabase.functions.invoke("spotify-search", {
        body: { query: searchQuery }
      });

      if (error) {
        console.error('Search error:', error);
        throw error;
      }

      console.log('Search results:', data);
      if (!data) throw new Error('No results found');
      
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
      console.log('Processing URL:', input);
      const { data, error } = await supabase.functions.invoke("spotify-search", {
        body: { url: input }
      });

      if (error) throw error;
      if (!data) throw new Error("No data returned from Spotify");

      console.log('URL lookup result:', data);
      onNext(data);
    } catch (error) {
      console.error("Error fetching from URL:", error);
      toast.error("Failed to fetch content information. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultSelect = (result: SearchResult) => {
    console.log('Selected result:', result);
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

      <div className="space-y-6">
        <div className="space-y-3">
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
              <Input
                placeholder="Search by title/artist or paste Spotify URL"
                value={input}
                onChange={e => setInput(e.target.value)}
                className="h-12 pl-10 pr-24 text-base shadow-sm border-[#E6E6E6] focus:border-[#6851FB] focus:ring-[#6851FB]/20"
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

          <div className="mt-4 space-y-2 border-t border-[#E6E6E6] pt-4 my-[28px]">
            <p className="text-sm font-medium text-[#374151] mb-3 my-[6px]">
              Supported formats:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ContentTypeInfo
                icon={Music}
                title="Tracks"
                methods="Search + URL"
              />
              <ContentTypeInfo
                icon={Disc}
                title="Albums"
                methods="Search + URL"
              />
              <ContentTypeInfo
                icon={Disc}
                title="EPs/Singles"
                methods="Search + URL"
              />
              <ContentTypeInfo
                icon={ListMusic}
                title="Playlists"
                methods="URL only"
              />
            </div>
          </div>
        </div>

        {!isUrlMode && searchResults && (
          <div className="space-y-6">
            {searchResults.tracks.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-heading text-lg font-medium">Tracks</h3>
                <div className="space-y-3">
                  {searchResults.tracks.slice(0, 5).map(track => (
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
                  {searchResults.albums.slice(0, 5).map(album => (
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
