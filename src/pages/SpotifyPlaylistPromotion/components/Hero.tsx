
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
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/lovable-uploads/hero-gradient.svg')`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center center'
        }}
      />
      
      {/* Content Container */}
      <div className="relative container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-heading animate-fade-in">
            Get Real Exposure on{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-50">
              Verified Spotify Playlists
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto animate-fade-in [animation-delay:200ms]">
            We carefully match your music with quality-verified playlist curators
          </p>

          <div className="flex justify-center mb-6 animate-fade-in [animation-delay:300ms]">
            <ArrowDown className="w-6 h-6 text-white/80 animate-bounce" />
          </div>

          {/* Search Input */}
          <div className="relative max-w-3xl mx-auto mb-8 animate-fade-in [animation-delay:400ms] group">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search your track or paste Spotify URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-[72px] px-8 pl-16 text-xl text-white placeholder:text-white/90 rounded-2xl 
                bg-white/20 backdrop-blur-xl border-white/20 
                shadow-[0_0_25px_rgba(255,255,255,0.1)]
                transition-all duration-300 
                hover:bg-white/25 hover:shadow-[0_0_35px_rgba(255,255,255,0.2)]
                focus:bg-white/30 focus:shadow-[0_0_40px_rgba(255,255,255,0.25)] focus:ring-2 focus:ring-white/30"
              />
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-white/80" />
            </div>

            {/* Trust Message */}
            <p className="mt-4 text-white/80 text-sm">
              Join thousands of artists who trust our proven service for genuine exposure. 100% money-back guarantee if you're not completely satisfied—no questions asked.
            </p>

            {/* Search Results */}
            {searchQuery.length > 2 && (
              <div className="absolute z-50 w-full mt-2">
                {isLoading ? (
                  <Card className="p-4 flex items-center justify-center bg-white/20 backdrop-blur-xl border-white/20">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                    <span className="ml-2 text-white">Searching...</span>
                  </Card>
                ) : searchResults && searchResults.length > 0 ? (
                  <Card className="divide-y divide-white/10 overflow-hidden max-h-[400px] overflow-y-auto bg-white/20 backdrop-blur-xl border-white/20">
                    {searchResults.map((track: Track) => (
                      <button
                        key={track.spotifyId}
                        onClick={() => handleSelectTrack(track)}
                        className="w-full p-4 flex items-center gap-4 hover:bg-white/10 transition-colors text-white group"
                      >
                        <img
                          src={track.artworkUrl || "/placeholder.svg"}
                          alt={track.title}
                          className="w-12 h-12 object-cover rounded shadow-lg group-hover:scale-105 transition-transform"
                        />
                        <div className="flex-1 text-left">
                          <p className="font-medium">{track.title}</p>
                          <p className="text-sm text-white/70">{track.artist}</p>
                        </div>
                      </button>
                    ))}
                  </Card>
                ) : searchQuery.length > 2 && (
                  <Card className="p-4 text-center text-white/70 bg-white/20 backdrop-blur-xl border-white/20">
                    No tracks found
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Social Proof */}
          <div className="text-white/80 mb-8 animate-fade-in [animation-delay:500ms]">
            Join 5,000+ artists already promoting their music
          </div>

          {/* Selected Track Display */}
          {selectedTrack && (
            <Card className="p-6 mb-12 bg-white/20 backdrop-blur-xl border-white/20 max-w-2xl mx-auto rounded-2xl animate-fade-in shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              <div className="flex items-center gap-6">
                <img
                  src={selectedTrack.artworkUrl || "/placeholder.svg"}
                  alt={selectedTrack.title}
                  className="w-20 h-20 object-cover rounded-lg shadow-lg"
                />
                <div className="flex-1 text-left">
                  <h3 className="text-xl font-semibold text-white">{selectedTrack.title}</h3>
                  <p className="text-white/70 text-lg">{selectedTrack.artist}</p>
                </div>
                <Button 
                  onClick={handlePromoteClick}
                  className="bg-secondary hover:bg-secondary/90 text-white font-medium px-8 h-12 text-lg rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
                >
                  Promote Track
                </Button>
              </div>
            </Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto mt-16 animate-fade-in [animation-delay:600ms]">
            <div className="text-center transform hover:scale-105 transition-transform duration-300">
              <div className="flex justify-center mb-4">
                <Users className="h-8 w-8 text-white/90" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">5,000+</div>
              <div className="text-white/70">Artists Promoted</div>
            </div>
            <div className="text-center transform hover:scale-105 transition-transform duration-300">
              <div className="flex justify-center mb-4">
                <Music className="h-8 w-8 text-white/90" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">750+</div>
              <div className="text-white/70">Active Playlists</div>
            </div>
            <div className="text-center transform hover:scale-105 transition-transform duration-300">
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

