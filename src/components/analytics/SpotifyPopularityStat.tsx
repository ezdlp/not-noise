
import React from 'react';
import { StatCard } from '@/components/analytics/StatCard';
import { Music, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SpotifyPopularityStatProps {
  popularityScore: number | null;
  trendValue: number;
  isLoading: boolean;
}

export function SpotifyPopularityStat({ 
  popularityScore, 
  trendValue, 
  isLoading 
}: SpotifyPopularityStatProps) {
  return (
    <StatCard
      title={
        <div className="flex items-center gap-1">
          <span>Spotify Popularity</span>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={14} className="text-[#6B7280] hover:text-primary transition-colors cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-white border border-neutral-border shadow-md">
                <p className="text-sm font-dm-sans">
                  Spotify assigns each song a Popularity Score (0-100) based on its recent streams, 
                  saves, and engagement. A higher score increases your chances of being included 
                  in algorithmic playlists.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      }
      value={popularityScore !== null ? `${popularityScore}/100` : 'N/A'}
      type="spotify"
      trend={trendValue}
      isLoading={isLoading}
      customIcon={<Music size={16} className="text-primary" />}
    />
  );
}
