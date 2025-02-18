import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DailyStatsChart } from "@/components/dashboard/DailyStatsChart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { StatCard } from "@/components/analytics/StatCard";
import { formatDistanceToNow } from "date-fns";
import { subDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { GeoStatsTable } from "@/components/analytics/GeoStatsTable";
import { TimeRangeSelect, TimeRangeValue, timeRanges } from "@/components/analytics/TimeRangeSelect";
import { useState, useMemo, useEffect } from "react";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-neutral-border bg-white p-4 shadow-md animate-fade-in">
        <p className="mb-2 text-sm font-medium text-[#111827] font-poppins">{label}</p>
        <div className="text-sm font-dm-sans">
          <span className="font-medium text-primary">
            Clicks:
          </span>{" "}
          <span className="text-[#6B7280]">{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function SmartLinkAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRangeValue>('28d');

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

  useEffect(() => {
    // Track analytics page view
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
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

  const platformData = smartLink.platform_links?.map((pl) => ({
    name: pl.platform_name,
    clicks: pl.clicks?.filter(
      click => new Date(click.clicked_at) >= new Date(startDate)
    ).length || 0,
  })) || [];

  platformData.sort((a, b) => b.clicks - a.clicks);

  return (
    <div className="container mx-auto py-6 px-4 space-y-6 animate-fade-in bg-[#FAFAFA] min-h-screen">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 border-b border-neutral-border">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="hover:bg-neutral-seasalt transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold text-[#111827] font-poppins">{smartLink.title} Analytics</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </div>

      <Card className="p-6 transition-all duration-300 hover:shadow-md border border-neutral-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#111827] font-poppins">Daily Performance</h2>
          <TimeRangeSelect value={timeRange} onChange={setTimeRange} />
        </div>
        {id && <DailyStatsChart smartLinkId={id} startDate={startDate} />}
      </Card>

      <Card className="p-6 transition-all duration-300 hover:shadow-md border border-neutral-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#111827] font-poppins">Platform Performance</h2>
          <TimeRangeSelect value={timeRange} onChange={setTimeRange} />
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformData}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6851FB" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#4A47A5" stopOpacity={1}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#E6E6E6"
                opacity={0.4}
                vertical={false}
              />
              <XAxis 
                dataKey="name" 
                stroke="#374151"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dy={10}
                tick={{ fill: '#374151' }}
                className="font-dm-sans"
              />
              <YAxis 
                stroke="#374151"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dx={-10}
                tick={{ fill: '#374151' }}
                className="font-dm-sans"
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="clicks" 
                fill="url(#barGradient)"
                radius={[4, 4, 0, 0]}
                className="transition-all duration-300"
              >
                <LabelList 
                  dataKey="clicks" 
                  position="top" 
                  fill="#374151"
                  fontSize={11}
                  className="font-dm-sans"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6 transition-all duration-300 hover:shadow-md border border-neutral-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#111827] font-poppins">Geographic Breakdown</h2>
          <TimeRangeSelect value={timeRange} onChange={setTimeRange} />
        </div>
        <GeoStatsTable data={geoStats || []} />
      </Card>

      <Card className="p-6 transition-all duration-300 hover:shadow-md border border-neutral-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#111827] font-poppins">Recent Clicks</h2>
          <Button variant="outline" size="sm">View all</Button>
        </div>
        <div className="space-y-4">
          {smartLink.platform_links
            ?.flatMap((pl) =>
              (pl.clicks || [])
                .filter(click => new Date(click.clicked_at) >= new Date(startDate))
                .map((click) => ({
                  ...click,
                  platform_name: pl.platform_name,
                  platform_id: pl.platform_id,
                }))
            )
            .sort(
              (a, b) =>
                new Date(b.clicked_at).getTime() -
                new Date(a.clicked_at).getTime()
            )
            .slice(0, 5)
            .map((click) => (
              <div
                key={click.id}
                className="flex items-center justify-between border-b border-neutral-border pb-4 hover:bg-neutral-seasalt/5 transition-all duration-200 -mx-2 px-2 rounded-lg"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <img 
                      src={`/lovable-uploads/${click.platform_id.toLowerCase()}.png`}
                      alt={click.platform_name}
                      className="w-4 h-4 object-contain"
                    />
                    <p className="text-sm font-medium text-[#111827] font-dm-sans">{click.platform_name}</p>
                  </div>
                  <p className="text-sm text-[#6B7280] font-dm-sans mt-1">
                    {formatDistanceToNow(new Date(click.clicked_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="text-sm text-[#374151] font-dm-sans">
                  {click.country || "Unknown location"}
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
