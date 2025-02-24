
import { useQuery } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TimeRangeSelect, TimeRangeValue, timeRanges } from "@/components/analytics/TimeRangeSelect";

interface AnalyticsStats {
  day: string;
  page_views: number;
  unique_visitors: number;
  registered_users: number;
  active_users: number;
  pro_subscribers: number;
  new_subscribers: number;
  total_revenue: number;
}

function Analytics() {
  const [timeRange, setTimeRange] = useState<TimeRangeValue>('28d');
  
  const startDate = subDays(new Date(), timeRanges.find(r => r.value === timeRange)?.days || 28);

  const { data: stats, isLoading: isLoading, refetch } = useQuery({
    queryKey: ["analytics", timeRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_analytics_stats", {
        p_start_date: startDate.toISOString(),
      });

      if (error) throw error;
      return data as AnalyticsStats[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('analytics_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_page_views'
        },
        () => {
          refetch();
          toast.info('New page view recorded');
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_events'
        },
        () => {
          refetch();
          toast.info('New event recorded');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-neutral-night">Analytics</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="h-20 animate-pulse bg-neutral-seasalt rounded" />
            </Card>
          ))}
        </div>
        <Card className="p-4">
          <div className="h-[400px] animate-pulse bg-neutral-seasalt rounded" />
        </Card>
      </div>
    );
  }

  const latestStats = stats && stats.length > 0 ? stats[stats.length - 1] : {
    page_views: 0,
    unique_visitors: 0,
    registered_users: 0,
    active_users: 0,
    pro_subscribers: 0,
    new_subscribers: 0,
    total_revenue: 0,
  };

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 border-b border-neutral-border">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-night">Analytics</h1>
          <TimeRangeSelect value={timeRange} onChange={setTimeRange} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 border-none bg-card/50 shadow-none">
          <h3 className="font-medium text-muted-foreground">Page Views</h3>
          <p className="text-2xl font-bold text-neutral-night">{latestStats.page_views}</p>
        </Card>
        <Card className="p-6 border-none bg-card/50 shadow-none">
          <h3 className="font-medium text-muted-foreground">Unique Visitors</h3>
          <p className="text-2xl font-bold text-neutral-night">{latestStats.unique_visitors}</p>
        </Card>
        <Card className="p-6 border-none bg-card/50 shadow-none">
          <h3 className="font-medium text-muted-foreground">Pro Users</h3>
          <p className="text-2xl font-bold text-neutral-night">{latestStats.pro_subscribers}</p>
        </Card>
        <Card className="p-6 border-none bg-card/50 shadow-none">
          <h3 className="font-medium text-muted-foreground">Active Users</h3>
          <p className="text-2xl font-bold text-neutral-night">{latestStats.active_users}</p>
        </Card>
        <Card className="p-6 border-none bg-card/50 shadow-none">
          <h3 className="font-medium text-muted-foreground">Monthly Revenue</h3>
          <p className="text-2xl font-bold text-neutral-night">${latestStats.total_revenue.toFixed(2)}</p>
        </Card>
        <Card className="p-6 border-none bg-card/50 shadow-none">
          <h3 className="font-medium text-muted-foreground">Registered Users</h3>
          <p className="text-2xl font-bold text-neutral-night">{latestStats.registered_users}</p>
        </Card>
        <Card className="p-6 border-none bg-card/50 shadow-none">
          <h3 className="font-medium text-muted-foreground">New Pro Users</h3>
          <p className="text-2xl font-bold text-neutral-night">{latestStats.new_subscribers}</p>
        </Card>
        <Card className="p-6 border-none bg-card/50 shadow-none">
          <h3 className="font-medium text-muted-foreground">Conversion Rate</h3>
          <p className="text-2xl font-bold text-neutral-night">
            {latestStats.unique_visitors > 0 
              ? ((latestStats.pro_subscribers / latestStats.unique_visitors) * 100).toFixed(2)
              : "0.00"}%
          </p>
        </Card>
      </div>

      <Card className="p-6 border-none bg-card/50 shadow-none">
        <h2 className="text-lg font-semibold mb-4 text-neutral-night">User Activity Trends</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats || []}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#E6E6E6"
                opacity={0.4}
              />
              <XAxis 
                dataKey="day" 
                stroke="#666666"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#666666"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E6E6E6',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(15, 15, 15, 0.05)'
                }}
              />
              <Area
                type="monotone"
                dataKey="page_views"
                stackId="1"
                stroke="#6851FB"
                fill="#6851FB"
                fillOpacity={0.3}
                name="Page Views"
              />
              <Area
                type="monotone"
                dataKey="unique_visitors"
                stackId="2"
                stroke="#37D299"
                fill="#37D299"
                fillOpacity={0.3}
                name="Unique Visitors"
              />
              <Area
                type="monotone"
                dataKey="registered_users"
                stackId="3"
                stroke="#FE28A2"
                fill="#FE28A2"
                fillOpacity={0.3}
                name="Registered Users"
              />
              <Area
                type="monotone"
                dataKey="active_users"
                stackId="4"
                stroke="#F97316"
                fill="#F97316"
                fillOpacity={0.3}
                name="Active Users"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6 border-none bg-card/50 shadow-none">
        <h2 className="text-lg font-semibold mb-4 text-neutral-night">Revenue & Subscription Trends</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats || []}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#E6E6E6"
                opacity={0.4}
              />
              <XAxis 
                dataKey="day" 
                stroke="#666666"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#666666"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E6E6E6',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(15, 15, 15, 0.05)'
                }}
              />
              <Area
                type="monotone"
                dataKey="pro_subscribers"
                stackId="1"
                stroke="#6851FB"
                fill="#6851FB"
                fillOpacity={0.3}
                name="Pro Users"
              />
              <Area
                type="monotone"
                dataKey="new_subscribers"
                stackId="2"
                stroke="#37D299"
                fill="#37D299"
                fillOpacity={0.3}
                name="New Pro Users"
              />
              <Area
                type="monotone"
                dataKey="total_revenue"
                stackId="3"
                stroke="#FE28A2"
                fill="#FE28A2"
                fillOpacity={0.3}
                name="Revenue ($)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

export default Analytics;
