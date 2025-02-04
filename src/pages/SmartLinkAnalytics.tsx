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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-neutral-border bg-white p-3 shadow-sm">
        <p className="mb-1 text-sm font-medium text-neutral-night">{label}</p>
        <div className="text-sm">
          <span className="font-medium text-primary">
            Clicks:
          </span>{" "}
          <span className="text-muted-foreground">{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function SmartLinkAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();

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
    queryKey: ["weeklyStats", id],
    queryFn: async () => {
      const twoWeeksAgo = subDays(new Date(), 14).toISOString();

      const { data, error } = await supabase.rpc("get_daily_stats", {
        p_smart_link_id: id,
        p_start_date: twoWeeksAgo,
      });

      if (error) throw error;

      // Calculate totals for current week and previous week
      const currentWeek = data.slice(-7);
      const previousWeek = data.slice(-14, -7);

      const currentWeekTotals = currentWeek.reduce(
        (acc, day) => ({
          views: acc.views + day.views,
          clicks: acc.clicks + day.clicks,
        }),
        { views: 0, clicks: 0 }
      );

      const previousWeekTotals = previousWeek.reduce(
        (acc, day) => ({
          views: acc.views + day.views,
          clicks: acc.clicks + day.clicks,
        }),
        { views: 0, clicks: 0 }
      );

      // Calculate percentage changes
      const viewsTrend = previousWeekTotals.views === 0 
        ? 100 
        : Math.round(((currentWeekTotals.views - previousWeekTotals.views) / previousWeekTotals.views) * 100);
      
      const clicksTrend = previousWeekTotals.clicks === 0 
        ? 100 
        : Math.round(((currentWeekTotals.clicks - previousWeekTotals.clicks) / previousWeekTotals.clicks) * 100);
      
      const currentCTR = currentWeekTotals.views === 0 
        ? 0 
        : (currentWeekTotals.clicks / currentWeekTotals.views) * 100;
      
      const previousCTR = previousWeekTotals.views === 0 
        ? 0 
        : (previousWeekTotals.clicks / previousWeekTotals.views) * 100;
      
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

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-seasalt rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="h-32 bg-neutral-seasalt"></Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!smartLink) return null;

  const totalViews = smartLink.link_views?.length || 0;
  const totalClicks = smartLink.platform_links?.reduce(
    (acc, pl) => acc + (pl.clicks?.length || 0),
    0
  ) || 0;
  const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

  const platformData = smartLink.platform_links?.map((pl) => ({
    name: pl.platform_name,
    clicks: pl.clicks?.length || 0,
  })) || [];

  // Sort platform data by clicks in descending order
  platformData.sort((a, b) => b.clicks - a.clicks);

  // Add total bar
  const totalClicks2 = platformData.reduce((sum, item) => sum + item.clicks, 0);
  if (totalClicks2 > 0) {
    platformData.push({ name: 'Total', clicks: totalClicks2 });
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4 border-b border-neutral-border">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="hover:bg-neutral-seasalt"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-neutral-night">{smartLink.title} Analytics</h1>
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

      {id && <DailyStatsChart smartLinkId={id} />}

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 text-neutral-night">Platform Performance</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformData}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#E6E6E6"
                opacity={0.4}
              />
              <XAxis 
                dataKey="name" 
                stroke="#666666"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#666666"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="clicks" 
                fill="#6851FB"
                fillOpacity={0.85}
                radius={[2, 2, 0, 0]}
              >
                <LabelList 
                  dataKey="clicks" 
                  position="top" 
                  fill="#666666"
                  fontSize={11}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-night">Recent Clicks</h2>
          <Button variant="outline" size="sm">View all</Button>
        </div>
        <div className="space-y-4">
          {smartLink.platform_links
            ?.flatMap((pl) =>
              (pl.clicks || []).map((click) => ({
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
                className="flex items-center justify-between border-b border-neutral-border pb-2 hover:bg-neutral-seasalt/5 transition-colors duration-200 -mx-2 px-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <img 
                      src={`/lovable-uploads/${click.platform_id.toLowerCase()}.png`}
                      alt={click.platform_name}
                      className="w-4 h-4 object-contain"
                    />
                    <p className="text-sm font-medium text-neutral-night">{click.platform_name}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(click.clicked_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="text-sm text-neutral-night">
                  {click.country || "Unknown location"}
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
