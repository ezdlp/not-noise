
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music, TrendingUp, Users } from "lucide-react";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
    setSearchQuery(''); // Clear search after selection
  };

  const handlePromoteClick = () => {
    if (selectedTrack) {
      navigate('pricing', { 
        state: { 
          selectedTrack: {
            title: selectedTrack.title,
            artist: selectedTrack.artist,
            artworkUrl: selectedTrack.artworkUrl
          }
        }
      });
    }
  };

  return (
    <section className="relative bg-gradient-to-b from-[#0F0F0F] to-background overflow-hidden">
      {/* Purple glow effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"
        aria-hidden="true"
      />
      
      <div className="container relative mx-auto px-4 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 font-heading">
              Boost Your Music with{" "}
              <span className="text-primary">Spotify Playlist</span> Promotion
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl mx-auto lg:mx-0">
              Get your music featured on curated playlists and reach new audiences worldwide. Start growing your streams today.
            </p>

            {/* Search Input */}
            <div className="relative">
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Input
                  type="text"
                  placeholder="Search your track or paste Spotify URL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>

              {/* Search Results */}
              {searchQuery.length > 2 && (
                <div className="absolute z-50 w-full mt-2">
                  {isLoading ? (
                    <Card className="p-4 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2 text-muted-foreground">Searching...</span>
                    </Card>
                  ) : searchResults && searchResults.length > 0 ? (
                    <Card className="divide-y divide-border overflow-hidden max-h-[400px] overflow-y-auto">
                      {searchResults.map((track: Track) => (
                        <button
                          key={track.spotifyId}
                          onClick={() => handleSelectTrack(track)}
                          className="w-full p-4 flex items-center gap-4 hover:bg-accent transition-colors"
                        >
                          <img
                            src={track.artworkUrl || "/placeholder.svg"}
                            alt={track.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1 text-left">
                            <p className="font-medium text-foreground">{track.title}</p>
                            <p className="text-sm text-muted-foreground">{track.artist}</p>
                          </div>
                        </button>
                      ))}
                    </Card>
                  ) : searchQuery.length > 2 && (
                    <Card className="p-4 text-center text-muted-foreground">
                      No tracks found
                    </Card>
                  )}
                </div>
              )}
            </div>

            {/* Selected Track Display */}
            {selectedTrack && (
              <Card className="p-4 mb-8 bg-white/10 border-white/20">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedTrack.artworkUrl || "/placeholder.svg"}
                    alt={selectedTrack.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{selectedTrack.title}</h3>
                    <p className="text-white/60">{selectedTrack.artist}</p>
                  </div>
                  <Button 
                    variant="default"
                    onClick={handlePromoteClick}
                    className="bg-primary hover:bg-primary-hover text-white font-medium px-8"
                  >
                    Promote Track
                  </Button>
                </div>
              </Card>
            )}

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-4 sm:gap-8">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">5,000+</div>
                <div className="text-sm text-white/60">Artists Promoted</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Music className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">750+</div>
                <div className="text-sm text-white/60">Active Playlists</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">2.5M+</div>
                <div className="text-sm text-white/60">Monthly Listeners</div>
              </div>
            </div>
          </div>

          {/* Right column - Visual */}
          <div className="relative hidden lg:block">
            <div className="absolute -inset-4">
              <div className="w-full h-full max-w-sm mx-auto">
                {/* Abstract gradient shape */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-primary/30 to-secondary/30 blur-3xl"
                  style={{ 
                    transform: 'scale(0.9) translate(20%, 20%)',
                    borderRadius: '50% 20% 30% 10%' 
                  }}
                />
              </div>
            </div>
            <div className="relative bg-neutral-night rounded-2xl border border-white/10 p-8">
              <img
                src="/lovable-uploads/spotify.png"
                alt="Spotify"
                className="w-8 h-8 mb-4"
              />
              <div className="space-y-4">
                <div className="h-12 bg-white/5 rounded-lg animate-pulse" />
                <div className="h-12 bg-white/5 rounded-lg animate-pulse" />
                <div className="h-12 bg-white/5 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

