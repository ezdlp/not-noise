import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SearchIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type SpotifyTrack = {
  id: string;
  title: string;
  artist: string;
  artworkUrl: string;
  spotifyId?: string;
  spotifyUrl: string;
  releaseDate?: string;
};

type SpotifyTrackSearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SpotifyTrackSearchModal({ isOpen, onClose }: SpotifyTrackSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Use React Query for automatic search with 3+ characters
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['spotify-modal-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 3) return { tracks: [] };
      
      try {
        console.log('Searching for:', searchQuery);
        
        // Use Supabase functions directly as this works consistently
        const { data, error } = await supabase.functions.invoke('spotify-search', {
          body: { query: searchQuery }
        });
        
        if (error) {
          console.error('Search error details:', error);
          toast.error("Failed to search tracks. Please try again.");
          return { tracks: [] };
        }
        
        if (!data) {
          console.log('No data returned from search');
          return { tracks: [] };
        }
        
        // Ensure we have tracks in the response
        const tracks = Array.isArray(data.tracks) ? data.tracks : [];
        console.log(`Found ${tracks.length} tracks`);
        
        return { tracks };
      } catch (error) {
        console.error('Search error details:', error);
        toast.error("An error occurred while searching. Please try again.");
        return { tracks: [] };
      }
    },
    enabled: searchQuery.length > 2 && isOpen, // Only run when query is 3+ chars and modal is open
    staleTime: 1000 * 60, // Cache results for 1 minute
  });

  // Handle track selection
  const handleTrackSelect = (track: SpotifyTrack) => {
    // Close the modal
    onClose();
    
    // Redirect to the pricing page with the selected track
    navigate('/spotify-playlist-promotion/pricing', {
      state: {
        selectedTrack: {
          title: track.title,
          artist: track.artist,
          id: track.id || track.spotifyId || "",
          artistId: track.id || track.spotifyId || "",
          artworkUrl: track.artworkUrl,
          genre: undefined
        }
      }
    });
    
    toast.success("Track selected! Choose your promotion plan.");
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setSearchQuery("");
    onClose();
  };

  const tracks = searchResults?.tracks || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDialogClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Find Your Track on Spotify</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-2">
          <div className="relative">
            <Input
              placeholder="Search your track or paste Spotify URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          
          <div className="min-h-[200px] max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <Card className="p-4 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Searching...</span>
              </Card>
            ) : searchQuery.length > 2 && tracks.length > 0 ? (
              <Card className="divide-y divide-neutral-200 overflow-hidden">
                {tracks.map((track) => (
                  <button
                    key={track.id || track.spotifyId || Math.random().toString()}
                    onClick={() => handleTrackSelect(track)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-neutral-50 transition-colors text-foreground group"
                  >
                    <img
                      src={track.artworkUrl || "/placeholder.svg"}
                      alt={track.title}
                      className="w-12 h-12 object-cover rounded shadow-sm group-hover:scale-105 transition-transform"
                    />
                    <div className="flex-1 text-left">
                      <p className="font-medium">{track.title}</p>
                      <p className="text-sm text-muted-foreground">{track.artist}</p>
                    </div>
                  </button>
                ))}
              </Card>
            ) : searchQuery.length > 2 ? (
              <Card className="p-4 text-center text-muted-foreground">
                No tracks found
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <SearchIcon className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Type at least 3 characters to search</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 