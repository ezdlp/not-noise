
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { subDays } from "date-fns";
import { useState, useMemo, useEffect } from "react";
import { analyticsService } from "@/features/analytics/services/analyticsService";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { StatCard } from "@/components/analytics/StatCard";
import { GeoStatsTable } from "@/components/analytics/GeoStatsTable";
import { DailyStatsChart } from "@/components/dashboard/DailyStatsChart";
import { TimeRangeSelect, TimeRangeValue, timeRanges } from "@/components/analytics/TimeRangeSelect";
import { SpotifyPopularityChart } from "@/components/analytics/SpotifyPopularityChart";
import { SpotifyPopularityStat } from "@/components/analytics/SpotifyPopularityStat";
import { SmartLinkAnalyticsHeader } from "@/features/analytics/components/SmartLinkAnalyticsHeader";
import { PlatformPerformanceChart } from "@/features/analytics/components/PlatformPerformanceChart";
import { RecentClicksList } from "@/features/analytics/components/RecentClicksList";

export default function SmartLinkAnalytics() {
  const { id } = useParams();
  const [timeRange, setTimeRange] = useState<TimeRangeValue>('28d');
  const { isFeatureEnabled } = useFeatureAccess();
  const hasSpotifyAccess = isFeatureEnabled('meta_pixel');

  const startDate = useMemo(() => {
    const range = timeRanges.find(r => r.value === timeRange);
    return subDays(new Date(), range?.days || 28).toISOString();
  }, [timeRange]);

  const { data: smartLink, isLoading } = useQuery({
    queryKey: ["smartLink", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("smart_links")
        .select(`
          *,
          platform_links (
            id,
            platform_id,
            platform_name,
            url,
            clicks:platform_clicks (
              id,
              clicked_at,
              country,
              user_agent
            )
          ),
          link_views (
            id,
            viewed_at,
            country,
            user_agent
          ),
          email_subscribers (
            id,
            email,
            subscribed_at
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: weeklyStats } = useQuery({
    queryKey: ["weeklyStats", id, startDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_daily_stats", {
        p_smart_link_id: id,
        p_start_date: startDate,
      });

      if (error) throw error;

      const currentPeriod = data.slice(-timeRanges.find(r => r.value === timeRange)?.days || -28);
      const previousPeriod = data.slice(-2 * (timeRanges.find(r => r.value === timeRange)?.days || 28), -(timeRanges.find(r => r.value === timeRange)?.days || 28));

      const currentTotals = currentPeriod.reduce(
        (acc, day) => ({
          views: acc.views + day.views,
          clicks: acc.clicks + day.clicks,
        }),
        { views: 0, clicks: 0 }
      );

      const previousTotals = previousPeriod.reduce(
        (acc, day) => ({
          views: acc.views + day.views,
          clicks: acc.clicks + day.clicks,
        }),
        { views: 0, clicks: 0 }
      );

      const viewsTrend = previousTotals.views === 0 
        ? 100 
        : Math.round(((currentTotals.views - previousTotals.views) / previousTotals.views) * 100);
      
      const clicksTrend = previousTotals.clicks === 0 
        ? 100 
        : Math.round(((currentTotals.clicks - previousTotals.clicks) / previousTotals.clicks) * 100);
      
      const currentCTR = currentTotals.views === 0 
        ? 0 
        : (currentTotals.clicks / currentTotals.views) * 100;
      
      const previousCTR = previousTotals.views === 0 
        ? 0 
        : (previousTotals.clicks / previousTotals.views) * 100;
      
      const ctrTrend = previousCTR === 0 
        ? 100 
        : Math.round(((currentCTR - previousCTR) / previousCTR) * 100);

      return {
        viewsTrend,
        clicksTrend,
        ctrTrend
      };
    },
  });

  const { data: geoStats } = useQuery({
    queryKey: ["geoStats", id, startDate],
    queryFn: async () => {
      const { data: linkViews } = await supabase
        .from('link_views')
        .select('country_code')
        .eq('smart_link_id', id)
        .gte('viewed_at', startDate);

      const { data: platformLinks } = await supabase
        .from('platform_links')
        .select(`
          id,
          platform_clicks (
            country_code,
            clicked_at
          )
        `)
        .eq('smart_link_id', id);

      const viewsByCountry = new Map<string, number>();
      const clicksByCountry = new Map<string, number>();

      linkViews?.forEach(view => {
        const countryCode = view.country_code || 'unknown';
        viewsByCountry.set(countryCode, (viewsByCountry.get(countryCode) || 0) + 1);
      });

      platformLinks?.forEach(link => {
        link.platform_clicks?.forEach(click => {
          if (new Date(click.clicked_at) >= new Date(startDate)) {
            const countryCode = click.country_code || 'unknown';
            clicksByCountry.set(countryCode, (clicksByCountry.get(countryCode) || 0) + 1);
          }
        });
      });

      const allCountryCodes = new Set([
        ...Array.from(viewsByCountry.keys()),
        ...Array.from(clicksByCountry.keys())
      ]);

      return Array.from(allCountryCodes).map(countryCode => ({
        countryCode,
        views: viewsByCountry.get(countryCode) || 0,
        clicks: clicksByCountry.get(countryCode) || 0,
        ctr: viewsByCountry.get(countryCode) 
          ? (clicksByCountry.get(countryCode) || 0) / viewsByCountry.get(countryCode)!
          : 0
      }));
    },
    enabled: !!id
  });

  const { data: spotifyPopularity, isLoading: isLoadingPopularity } = useQuery({
    queryKey: ["spotifyPopularity", id, startDate],
    queryFn: async () => {
      const response = await supabase.functions.invoke('get-spotify-popularity', {
        body: { smartLinkId: id, startDate }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch Spotify popularity data');
      }
      
      return response.data;
    },
    enabled: !!id && hasSpotifyAccess
  });

  useEffect(() => {
    if (id) {
      analyticsService.trackPageView(`/links/${id}/analytics`);
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 bg-[#FAFAFA]">
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 animate-pulse" />
            ))}
          </div>
          <Skeleton className="h-[400px] animate-pulse" />
          <Skeleton className="h-[400px] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!smartLink) return null;

  const totalViews = smartLink.link_views?.filter(
    view => new Date(view.viewed_at) >= new Date(startDate)
  ).length || 0;

  const totalClicks = smartLink.platform_links?.reduce(
    (acc, pl) => acc + (pl.clicks?.filter(
      click => new Date(click.clicked_at) >= new Date(startDate)
    ).length || 0),
    0
  ) || 0;

  const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

  const hasSpotifyLink = smartLink.platform_links?.some(link => link.platform_id === 'spotify');

  const platformData = smartLink.platform_links?.map((pl) => ({
    name: pl.platform_name,
    clicks: pl.clicks?.filter(
      click => new Date(click.clicked_at) >= new Date(startDate)
    ).length || 0,
  })) || [];

  platformData.sort((a, b) => b.clicks - a.clicks);

  const allClicks = smartLink.platform_links?.flatMap((pl) =>
    (pl.clicks || []).map((click) => ({
      ...click,
      platform_name: pl.platform_name,
      platform_id: pl.platform_id,
    }))
  ) || [];

  return (
    <div className="container mx-auto py-6 px-4 space-y-6 animate-fade-in bg-[#FAFAFA] min-h-screen">
      <SmartLinkAnalyticsHeader title={smartLink.title} />

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

      <Card className="p-6 transition-all duration-300 hover:shadow-md border border-neutral-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#111827] font-poppins">Daily Performance</h2>
          <TimeRangeSelect value={timeRange} onChange={setTimeRange} />
        </div>
        {id && <DailyStatsChart smartLinkId={id} startDate={startDate} />}
      </Card>

      <PlatformPerformanceChart 
        data={platformData} 
        timeRange={timeRange} 
        onTimeRangeChange={setTimeRange} 
      />

      {hasSpotifyAccess && hasSpotifyLink && (
        <SpotifyPopularityChart
          data={spotifyPopularity?.history || []}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          isLoading={isLoadingPopularity}
          smartLinkId={id}
        />
      )}

      <Card className="p-6 transition-all duration-300 hover:shadow-md border border-neutral-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#111827] font-poppins">Geographic Breakdown</h2>
          <TimeRangeSelect value={timeRange} onChange={setTimeRange} />
        </div>
        <GeoStatsTable data={geoStats || []} />
      </Card>

      <RecentClicksList clicks={allClicks} startDate={startDate} />
    </div>
  );
}
