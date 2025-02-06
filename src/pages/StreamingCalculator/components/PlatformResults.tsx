
import React from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface PlatformResultsProps {
  streamCount: number;
  timeframe: "monthly" | "yearly";
}

const PLATFORM_RATES = {
  spotify: {
    rate: 0.00387,
    name: "Spotify",
    icon: "/lovable-uploads/spotify.png"
  },
  appleMusic: {
    rate: 0.00800,
    name: "Apple Music",
    icon: "/lovable-uploads/applemusic.png"
  },
  tidal: {
    rate: 0.01284,
    name: "Tidal",
    icon: "/lovable-uploads/tidal.png"
  },
  amazonMusic: {
    rate: 0.00402,
    name: "Amazon Music",
    icon: "/lovable-uploads/amazonmusic.png"
  },
  youtubeMusic: {
    rate: 0.00220,
    name: "YouTube Music",
    icon: "/lovable-uploads/youtubemusic.png"
  },
  deezer: {
    rate: 0.00400,
    name: "Deezer",
    icon: "/lovable-uploads/deezer.png"
  }
};

export const PlatformResults = ({ streamCount, timeframe }: PlatformResultsProps) => {
  const multiplier = timeframe === "yearly" ? 12 : 1;
  const maxEarnings = Math.max(...Object.values(PLATFORM_RATES).map(p => p.rate * streamCount * multiplier));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(PLATFORM_RATES).map(([platform, data]) => {
        const earnings = data.rate * streamCount * multiplier;
        const percentage = (earnings / maxEarnings) * 100;

        return (
          <Card key={platform} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 relative">
                <img
                  src={data.icon}
                  alt={data.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="font-semibold">{data.name}</h3>
            </div>

            <div className="space-y-4">
              <div className="text-3xl font-bold text-primary">
                ${earnings.toFixed(2)}
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  ${data.rate.toFixed(5)} per stream
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

