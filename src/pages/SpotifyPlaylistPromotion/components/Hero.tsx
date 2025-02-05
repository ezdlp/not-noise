
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
    setSearchQuery('');
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
    <section className="relative min-h-screen overflow-hidden">
      {/* Base color and SVG background */}
      <div className="absolute inset-0 bg-[#6851fb]" />
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/lovable-uploads/hero-gradient.svg')`,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Content Container */}
      <div className="relative container mx-auto px-4 py-32">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-heading animate-fade-in">
            Boost Your Music with{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-50">
              Spotify Playlist
            </span>{" "}
            Promotion
          </h1>
          
          <p className="text-lg md:text-xl text-white/90 mb-12 max-w-2xl mx-auto animate-fade-in [animation-delay:200ms]">
            Get your music featured on curated playlists and reach new audiences worldwide. Start growing your streams today.
          </p>

          {/* Search Input */}
          <div className="relative max-w-2xl mx-auto mb-8 animate-fade-in [animation-delay:400ms]">
            <Input
              type="text"
              placeholder="Search your track or paste Spotify URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-16 px-6 bg-white/10 backdrop-blur-xl border-white/20 text-white placeholder:text-white/50 text-lg rounded-2xl shadow-lg transition-all duration-300 hover:bg-white/15 focus:bg-white/20 focus:ring-2 focus:ring-white/30"
            />

            {/* Search Results */}
            {searchQuery.length > 2 && (
              <div className="absolute z-50 w-full mt-2">
                {isLoading ? (
                  <Card className="p-4 flex items-center justify-center bg-white/10 backdrop-blur-xl border-white/20">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                    <span className="ml-2 text-white/80">Searching...</span>
                  </Card>
                ) : searchResults && searchResults.length > 0 ? (
                  <Card className="divide-y divide-white/10 overflow-hidden max-h-[400px] overflow-y-auto bg-white/10 backdrop-blur-xl border-white/20">
                    {searchResults.map((track: Track) => (
                      <button
                        key={track.spotifyId}
                        onClick={() => handleSelectTrack(track)}
                        className="w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors text-white"
                      >
                        <img
                          src={track.artworkUrl || "/placeholder.svg"}
                          alt={track.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1 text-left">
                          <p className="font-medium">{track.title}</p>
                          <p className="text-sm text-white/60">{track.artist}</p>
                        </div>
                      </button>
                    ))}
                  </Card>
                ) : searchQuery.length > 2 && (
                  <Card className="p-4 text-center text-white/60 bg-white/10 backdrop-blur-xl border-white/20">
                    No tracks found
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Selected Track Display */}
          {selectedTrack && (
            <Card className="p-6 mb-12 bg-white/10 backdrop-blur-xl border-white/20 max-w-2xl mx-auto rounded-2xl animate-fade-in">
              <div className="flex items-center gap-6">
                <img
                  src={selectedTrack.artworkUrl || "/placeholder.svg"}
                  alt={selectedTrack.title}
                  className="w-20 h-20 object-cover rounded-lg shadow-lg"
                />
                <div className="flex-1 text-left">
                  <h3 className="text-xl font-semibold text-white">{selectedTrack.title}</h3>
                  <p className="text-white/60 text-lg">{selectedTrack.artist}</p>
                </div>
                <Button 
                  variant="default"
                  onClick={handlePromoteClick}
                  className="bg-white hover:bg-white/90 text-purple-600 font-medium px-8 h-12 text-lg rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
                >
                  Promote Track
                </Button>
              </div>
            </Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-16 animate-fade-in [animation-delay:600ms]">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Users className="h-8 w-8 text-white/90" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">5,000+</div>
              <div className="text-white/70">Artists Promoted</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Music className="h-8 w-8 text-white/90" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">750+</div>
              <div className="text-white/70">Active Playlists</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-white/90" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">2.5M+</div>
              <div className="text-white/70">Monthly Listeners</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
