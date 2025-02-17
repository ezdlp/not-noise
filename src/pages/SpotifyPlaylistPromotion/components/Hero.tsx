
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music, TrendingUp, Users, Search, ArrowDown } from "lucide-react";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Track {
  title: string;
  artist: string;
  album: string;
  artworkUrl: string;
  spotifyId: string;
  spotifyUrl: string;
  releaseDate: string;
}

const Hero: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const navigate = useNavigate();

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['spotify-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 3) return null;
      try {
        const { data, error } = await supabase.functions.invoke('spotify-search', {
          body: { query: searchQuery }
        });
        if (error) throw error;
        
        if (data?.tracks?.items) {
          return data.tracks.items.map((track: any) => ({
            title: track.name,
            artist: track.artists.map((artist: any) => artist.name).join(', '),
            album: track.album.name,
            artworkUrl: track.album.images[0]?.url,
            spotifyId: track.id,
            spotifyUrl: track.external_urls.spotify,
            releaseDate: track.album.release_date
          }));
        }
        return [];
      } catch (error) {
        console.error('Search error:', error);
        return [];
      }
    },
    enabled: searchQuery.length > 2
  });

  const handleSelectTrack = (track: Track) => {
    setSelectedTrack(track);
    setSearchQuery('');
    toast.success("Track selected! Choose your promotion plan.");
  };

  const handlePromoteClick = () => {
    if (selectedTrack) {
      navigate('pricing', { 
        state: { 
          selectedTrack: {
            title: selectedTrack.title,
            artist: selectedTrack.artist,
            id: selectedTrack.spotifyId,
            artistId: selectedTrack.spotifyId,
            artworkUrl: selectedTrack.artworkUrl,
            genre: undefined
          }
        }
      });
    }
  };

  return (
    <section className="relative py-20 md:py-32 bg-white border-b border-neutral-200">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <h1 className="text-3xl md:text-5xl font-semibold text-[#111827] mb-6 font-heading">
            Get Real Exposure on{" "}
            <span className="text-primary">
              Verified Spotify Playlists
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-[#374151] mb-8 font-normal">
            We carefully match your music with quality-verified playlist curators
          </p>

          <div className="flex justify-center mb-6 animate-bounce">
            <ArrowDown className="w-6 h-6 text-primary/80" />
          </div>

          {/* Search Input */}
          <div className="relative max-w-3xl mx-auto mb-8 group">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search your track or paste Spotify URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-[72px] px-8 pl-16 text-xl text-[#111827] placeholder:text-[#6B7280] rounded-xl 
                bg-white border-neutral-200 shadow-sm
                transition-all duration-300 
                hover:border-primary/20 focus:border-primary
                focus:ring-2 focus:ring-primary/20"
              />
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-[#6B7280]" />
            </div>

            {/* Trust Message */}
            <p className="mt-4 text-[#6B7280] text-sm">
              Join thousands of artists who trust our proven service for genuine exposure. 100% money-back guarantee if you're not completely satisfied.
            </p>

            {/* Search Results */}
            {searchQuery.length > 2 && (
              <div className="absolute z-50 w-full mt-2">
                {isLoading ? (
                  <Card className="p-4 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-[#374151]">Searching...</span>
                  </Card>
                ) : searchResults && searchResults.length > 0 ? (
                  <Card className="divide-y divide-neutral-200 overflow-hidden max-h-[400px] overflow-y-auto">
                    {searchResults.map((track: Track) => (
                      <button
                        key={track.spotifyId}
                        onClick={() => handleSelectTrack(track)}
                        className="w-full p-4 flex items-center gap-4 hover:bg-neutral-50 transition-colors text-[#111827] group"
                      >
                        <img
                          src={track.artworkUrl || "/placeholder.svg"}
                          alt={track.title}
                          className="w-12 h-12 object-cover rounded shadow-sm group-hover:scale-105 transition-transform"
                        />
                        <div className="flex-1 text-left">
                          <p className="font-medium">{track.title}</p>
                          <p className="text-sm text-[#6B7280]">{track.artist}</p>
                        </div>
                      </button>
                    ))}
                  </Card>
                ) : searchQuery.length > 2 && (
                  <Card className="p-4 text-center text-[#6B7280]">
                    No tracks found
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Selected Track Display */}
          {selectedTrack && (
            <Card className="p-6 mb-12 bg-white border border-neutral-200 max-w-2xl mx-auto rounded-xl shadow-sm">
              <div className="flex items-center gap-6">
                <img
                  src={selectedTrack.artworkUrl || "/placeholder.svg"}
                  alt={selectedTrack.title}
                  className="w-20 h-20 object-cover rounded-lg shadow-sm"
                />
                <div className="flex-1 text-left">
                  <h3 className="text-xl font-semibold text-[#111827]">{selectedTrack.title}</h3>
                  <p className="text-[#374151]">{selectedTrack.artist}</p>
                </div>
                <Button 
                  onClick={handlePromoteClick}
                  className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl shadow-sm transition-all duration-300 hover:scale-105"
                >
                  Promote Track
                </Button>
              </div>
            </Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto mt-16">
            <div className="text-center transform hover:scale-105 transition-transform duration-300">
              <div className="flex justify-center mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="text-2xl font-semibold text-[#111827] mb-2">5,000+</div>
              <div className="text-[#6B7280]">Artists Promoted</div>
            </div>
            <div className="text-center transform hover:scale-105 transition-transform duration-300">
              <div className="flex justify-center mb-4">
                <Music className="h-8 w-8 text-primary" />
              </div>
              <div className="text-2xl font-semibold text-[#111827] mb-2">750+</div>
              <div className="text-[#6B7280]">Active Playlists</div>
            </div>
            <div className="text-center transform hover:scale-105 transition-transform duration-300">
              <div className="flex justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <div className="text-2xl font-semibold text-[#111827] mb-2">2.5M+</div>
              <div className="text-[#6B7280]">Monthly Listeners</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
