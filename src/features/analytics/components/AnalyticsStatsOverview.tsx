
import React from "react";
import { StatCard } from "@/components/analytics/StatCard";
import { SpotifyPopularityStat } from "@/components/analytics/SpotifyPopularityStat";
import { DailyStats } from "@/models/smartLinkAnalytics";

interface AnalyticsStatsOverviewProps {
  totalViews: number;
  totalClicks: number;
  ctr: number;
  weeklyStats?: DailyStats;
  spotifyPopularity?: {
    latestScore?: number;
    trendValue?: number;
  };
  hasSpotifyLink: boolean;
  hasSpotifyAccess: boolean;
  isLoadingPopularity: boolean;
}

export function AnalyticsStatsOverview({
  totalViews,
  totalClicks,
  ctr,
  weeklyStats,
  spotifyPopularity,
  hasSpotifyLink,
  hasSpotifyAccess,
  isLoadingPopularity,
}: AnalyticsStatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Views"
        value={totalViews}
        type="views"
        trend={weeklyStats?.viewsTrend}
      />
      <StatCard
        title="Total Clicks"
        value={totalClicks}
        type="clicks"
        trend={weeklyStats?.clicksTrend}
      />
      <StatCard
        title="CTR"
        value={`${ctr.toFixed(1)}%`}
        type="ctr"
        trend={weeklyStats?.ctrTrend}
      />
      {hasSpotifyAccess && hasSpotifyLink && (
        <SpotifyPopularityStat
          popularityScore={spotifyPopularity?.latestScore}
          trendValue={spotifyPopularity?.trendValue || 0}
          isLoading={isLoadingPopularity}
        />
      )}
    </div>
  );
}
