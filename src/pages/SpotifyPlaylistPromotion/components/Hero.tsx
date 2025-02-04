
import { Button } from "@/components/ui/button";
import { Music, TrendingUp, Users } from "lucide-react";
import React from "react";

const Hero: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-b from-[#0F0F0F] to-background overflow-hidden">
      {/* Purple glow effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"
        aria-hidden="true"
      />
      
      <div className="container relative mx-auto px-4 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 font-heading">
              Boost Your Music with{" "}
              <span className="text-primary">Spotify Playlist</span> Promotion
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl mx-auto lg:mx-0">
              Get your music featured on curated playlists and reach new audiences worldwide. Start growing your streams today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary-hover text-white font-medium px-8"
              >
                Start Promoting Now
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="bg-transparent border-white/20 text-white hover:bg-white/10 px-8"
              >
                View Pricing
              </Button>
            </div>

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

