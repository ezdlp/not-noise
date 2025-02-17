
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [searchType, setSearchType] = useState<'track' | 'playlist'>('track');

  const extractSpotifyId = (url: string, type: 'track' | 'playlist') => {
    const match = url.match(new RegExp(`${type}\/([a-zA-Z0-9]+)`));
    return match ? match[1] : null;
  };

  const fetchPlaylistById = async (playlistId: string) => {
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

      const playlist = await spotifyApi.getPlaylist(playlistId);
      
      if (!playlist.body) {
        toast.error("Playlist not found");
        return;
      }

      const playlistData = {
        title: playlist.body.name,
        artist: playlist.body.owner.display_name,
        artworkUrl: playlist.body.images[0]?.url,
        spotifyId: playlist.body.id,
        spotifyUrl: playlist.body.external_urls.spotify,
        content_type: 'playlist' as const,
        playlist_metadata: {
          track_count: playlist.body.tracks.total,
          playlist_owner: playlist.body.owner.display_name,
          owner_id: playlist.body.owner.id,
          is_collaborative: playlist.body.collaborative,
          last_updated_at: new Date().toISOString(),
          tracks_preview: playlist.body.tracks.items.slice(0, 5).map(item => ({
            name: item.track.name,
            artist: item.track.artists.map(artist => artist.name).join(", "),
            preview_url: item.track.preview_url
          }))
        }
      };

      onNext(playlistData);
    } catch (error) {
      console.error("Error fetching playlist:", error);
      toast.error("Failed to fetch playlist. Please try searching instead.");
    } finally {
      setIsLoading(false);
    }
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
        content_type: 'track' as const
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

      let results;
      if (searchType === 'track') {
        results = await spotifyApi.searchTracks(query, { limit: 10 });
        if (results.body.tracks?.items.length === 0) {
          toast.error("No tracks found. Please try a different search term.");
          setSearchResults([]);
          return;
        }

        const tracks = results.body.tracks?.items.map(track => ({
          title: track.name,
          artist: track.artists.map(artist => artist.name).join(", "),
          album: track.album.name,
          artworkUrl: track.album.images[0]?.url,
          spotifyId: track.id,
          spotifyUrl: track.external_urls.spotify,
          releaseDate: track.album.release_date,
          content_type: 'track' as const,
          relevanceScore: calculateRelevanceScore(track, query)
        }));

        setSearchResults(tracks.sort((a, b) => b.relevanceScore - a.relevanceScore));
      } else {
        results = await spotifyApi.searchPlaylists(query, { limit: 10 });
        if (results.body.playlists?.items.length === 0) {
          toast.error("No playlists found. Please try a different search term.");
          setSearchResults([]);
          return;
        }

        const playlists = results.body.playlists?.items.map(playlist => ({
          title: playlist.name,
          artist: playlist.owner.display_name,
          artworkUrl: playlist.images[0]?.url,
          spotifyId: playlist.id,
          spotifyUrl: playlist.external_urls.spotify,
          content_type: 'playlist' as const,
          playlist_metadata: {
            track_count: playlist.tracks.total,
            playlist_owner: playlist.owner.display_name,
            owner_id: playlist.owner.id,
            is_collaborative: playlist.collaborative,
            last_updated_at: new Date().toISOString(),
          },
          relevanceScore: calculateRelevanceScore(playlist, query)
        }));

        setSearchResults(playlists.sort((a, b) => b.relevanceScore - a.relevanceScore));
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search. Please try again.");
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRelevanceScore = (item: any, query: string) => {
    const queryLower = query.toLowerCase();
    const titleMatch = item.name.toLowerCase().includes(queryLower) ? 2 : 0;
    const artistMatch = searchType === 'track' 
      ? item.artists.some((artist: any) => artist.name.toLowerCase().includes(queryLower)) ? 1 : 0
      : item.owner.display_name.toLowerCase().includes(queryLower) ? 1 : 0;
    return titleMatch + artistMatch;
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // Check if it's a Spotify URL
    const trackId = extractSpotifyId(value, 'track');
    const playlistId = extractSpotifyId(value, 'playlist');
    
    if (trackId && searchType === 'track') {
      fetchTrackById(trackId);
      return;
    } else if (playlistId && searchType === 'playlist') {
      fetchPlaylistById(playlistId);
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

  const handleSelectItem = async (item: any) => {
    setIsLoading(true);
    
    if (item.content_type === 'playlist') {
      // Fetch full playlist details including tracks preview
      await fetchPlaylistById(item.spotifyId);
    } else {
      onNext({
        ...item,
        artworkUrl: item.artworkUrl || "/placeholder.svg",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg sm:text-xl font-semibold">Search Your Music</h2>
        <p className="text-sm text-muted-foreground">
          Search for your track or playlist, or paste a Spotify URL
        </p>
      </div>

      <Tabs defaultValue="track" className="w-full" onValueChange={(value) => setSearchType(value as 'track' | 'playlist')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="track">Track</TabsTrigger>
          <TabsTrigger value="playlist">Playlist</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex gap-2">
        <Input
          placeholder={`Search by ${searchType} name or paste Spotify URL...`}
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1 focus:ring-primary focus:border-primary h-10"
          disabled={isLoading}
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-6 sm:py-8">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
          <span className="ml-2 text-sm sm:text-base text-muted-foreground">Searching...</span>
        </div>
      )}

      <div className="space-y-3 sm:space-y-4">
        {searchResults.map((item) => (
          <Card key={item.spotifyId} className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <img 
                src={item.artworkUrl || "/placeholder.svg"} 
                alt={`${item.title} cover`} 
                className="w-full sm:w-24 h-40 sm:h-24 object-cover rounded-lg"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  console.error("Failed to load search result artwork:", item.artworkUrl);
                  img.src = "/placeholder.svg";
                }}
              />
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-base sm:text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.artist}</p>
                {item.content_type === 'track' && (
                  <p className="text-xs sm:text-sm text-muted-foreground">{item.album}</p>
                )}
                {item.content_type === 'playlist' && (
                  <p className="text-xs sm:text-sm text-muted-foreground">{item.playlist_metadata.track_count} tracks</p>
                )}
                <Button 
                  onClick={() => handleSelectItem(item)} 
                  className="w-full sm:w-auto mt-2 sm:mt-4"
                >
                  Use This {item.content_type === 'track' ? 'Track' : 'Playlist'}
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
