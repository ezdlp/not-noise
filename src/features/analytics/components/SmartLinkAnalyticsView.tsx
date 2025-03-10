
import React from "react";
import { SmartLinkAnalyticsHeader } from "./SmartLinkAnalyticsHeader";
import { AnalyticsStatsOverview } from "./AnalyticsStatsOverview";
import { DailyPerformanceCard } from "./DailyPerformanceCard";
import { PlatformPerformanceChart } from "./PlatformPerformanceChart";
import { SpotifyPopularityChart } from "@/components/analytics/SpotifyPopularityChart";
import { GeographicStatsCard } from "./GeographicStatsCard";
import { RecentClicksList } from "./RecentClicksList";
import { SmartLinkAnalyticsViewProps } from "@/models/smartLinkAnalytics";

export function SmartLinkAnalyticsView({
  smartLink,
  weeklyStats,
  timeRange,
  startDate,
  geoStats,
  spotifyPopularity,
  isLoadingPopularity,
  hasSpotifyAccess,
  onTimeRangeChange,
}: SmartLinkAnalyticsViewProps) {
  const totalViews = smartLink.link_views?.filter(
    (view: any) => new Date(view.viewed_at) >= new Date(startDate)
  ).length || 0;

  const totalClicks = smartLink.platform_links?.reduce(
    (acc: number, pl: any) => acc + (pl.clicks?.filter(
      (click: any) => new Date(click.clicked_at) >= new Date(startDate)
    ).length || 0),
    0
  ) || 0;

  const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

  const hasSpotifyLink = smartLink.platform_links?.some((link: any) => link.platform_id === 'spotify');

  const platformData = smartLink.platform_links?.map((pl: any) => ({
    name: pl.platform_name,
    clicks: pl.clicks?.filter(
      (click: any) => new Date(click.clicked_at) >= new Date(startDate)
    ).length || 0,
  })) || [];

  platformData.sort((a: any, b: any) => b.clicks - a.clicks);

  const allClicks = smartLink.platform_links?.flatMap((pl: any) =>
    (pl.clicks || []).map((click: any) => ({
      ...click,
      platform_name: pl.platform_name,
      platform_id: pl.platform_id,
    }))
  ) || [];

  return (
    <div className="container mx-auto py-6 px-4 space-y-6 animate-fade-in bg-[#FAFAFA] min-h-screen">
      <SmartLinkAnalyticsHeader title={smartLink.title} />

      <AnalyticsStatsOverview
        totalViews={totalViews}
        totalClicks={totalClicks}
        ctr={ctr}
        weeklyStats={weeklyStats}
        spotifyPopularity={spotifyPopularity}
        hasSpotifyLink={hasSpotifyLink}
        hasSpotifyAccess={hasSpotifyAccess}
        isLoadingPopularity={isLoadingPopularity}
      />

      <DailyPerformanceCard
        smartLinkId={smartLink.id}
        startDate={startDate}
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
      />

      <PlatformPerformanceChart 
        data={platformData} 
        timeRange={timeRange} 
        onTimeRangeChange={onTimeRangeChange} 
      />

      {hasSpotifyAccess && hasSpotifyLink && (
        <SpotifyPopularityChart
          data={spotifyPopularity?.history || []}
          timeRange={timeRange}
          onTimeRangeChange={onTimeRangeChange}
          isLoading={isLoadingPopularity}
          smartLinkId={smartLink.id}
        />
      )}

      <GeographicStatsCard
        geoStats={geoStats}
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
      />

      <RecentClicksList clicks={allClicks} startDate={startDate} />
    </div>
  );
}
