
import React from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface PlatformResultsProps {
  count: number;
  calculationType: "streams" | "monthlyListeners";
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

const AVERAGE_STREAMS_PER_LISTENER = 3;

export const PlatformResults = ({ count, calculationType }: PlatformResultsProps) => {
  const calculateEarnings = (rate: number, count: number) => {
    if (calculationType === "monthlyListeners") {
      return rate * count * AVERAGE_STREAMS_PER_LISTENER;
    }
    return rate * count;
  };

  const earnings = Object.values(PLATFORM_RATES).map(p => calculateEarnings(p.rate, count));
  const maxEarnings = Math.max(...earnings);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(PLATFORM_RATES).map(([platform, data], index) => {
        const earnings = calculateEarnings(data.rate, count);
        const percentage = (earnings / maxEarnings) * 100;

        return (
          <Card key={platform} className="p-6 hover:shadow-md transition-shadow backdrop-blur-sm bg-white/80">
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
              <div>
                <div className="text-3xl font-bold text-primary">
                  ${earnings.toFixed(2)}
                </div>
                {calculationType === "monthlyListeners" && (
                  <div className="text-sm text-muted-foreground mt-1">
                    ${(earnings * 12).toFixed(2)} / year
                  </div>
                )}
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
