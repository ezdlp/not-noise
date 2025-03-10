
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { subDays } from "date-fns";
import { useState, useMemo, useEffect } from "react";
import { analyticsService } from "@/features/analytics/services/analyticsService";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { TimeRangeSelect, TimeRangeValue, timeRanges } from "@/components/analytics/TimeRangeSelect";
import { SmartLinkAnalyticsView } from "@/features/analytics/components/SmartLinkAnalyticsView";

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

  return (
    <SmartLinkAnalyticsView
      smartLink={smartLink}
      weeklyStats={weeklyStats}
      timeRange={timeRange}
      startDate={startDate}
      geoStats={geoStats}
      spotifyPopularity={spotifyPopularity}
      isLoadingPopularity={isLoadingPopularity}
      hasSpotifyAccess={hasSpotifyAccess}
      onTimeRangeChange={setTimeRange}
    />
  );
}
