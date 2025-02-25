
import { useQuery } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { TimeRangeSelect, TimeRangeValue, timeRanges } from "@/components/analytics/TimeRangeSelect";
import { Bar, BarChart, Line, LineChart } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

interface AnalyticsStats {
  day: string;
  page_views: number;
  unique_visitors: number;
  registered_users: number;
  active_users: number;
  pro_subscribers: number;
  total_revenue: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  className?: string;
}

function StatCard({ title, value, change, className }: StatCardProps) {
  return (
    <Card className={cn("p-6 border-none bg-card/50 shadow-none", className)}>
      <h3 className="font-medium text-muted-foreground">{title}</h3>
      <p className="text-2xl font-bold text-neutral-night">{value}</p>
      {change !== undefined && (
        <p className={cn(
          "text-sm mt-1",
          change > 0 ? "text-emerald-600" : change < 0 ? "text-red-600" : "text-muted-foreground"
        )}>
          {change > 0 ? "+" : ""}{change}%
        </p>
      )}
    </Card>
  );
}

function Analytics() {
  const [timeRange, setTimeRange] = useState<TimeRangeValue>('28d');
  
  const startDate = subDays(new Date(), timeRanges.find(r => r.value === timeRange)?.days || 28);

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ["analytics", timeRange],
    queryFn: async () => {
      console.log('Fetching analytics stats for date range:', startDate.toISOString());
      const { data, error } = await supabase.rpc("get_analytics_stats", {
        p_start_date: startDate.toISOString(),
      });

      if (error) {
        console.error('Analytics query error:', error);
        throw error;
      }
      
      console.log('Received analytics data:', data);
      return data as AnalyticsStats[];
    },
    retry: 2,
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

  const currentMetrics = useMemo(() => {
    if (!stats || stats.length === 0) return null;

    const latest = stats[stats.length - 1];
    const total = stats.reduce((acc, day) => ({
      page_views: acc.page_views + day.page_views,
      unique_visitors: acc.unique_visitors + day.unique_visitors,
      registered_users: acc.registered_users + day.registered_users,
      active_users: acc.active_users + day.active_users,
      pro_subscribers: acc.pro_subscribers + day.pro_subscribers,
      total_revenue: acc.total_revenue + day.total_revenue,
    }), {
      page_views: 0,
      unique_visitors: 0,
      registered_users: 0,
      active_users: 0,
      pro_subscribers: 0,
      total_revenue: 0,
    });

    const conversionRate = total.unique_visitors > 0 
      ? ((total.pro_subscribers / total.unique_visitors) * 100).toFixed(2)
      : "0.00";

    return {
      latest,
      total,
      conversionRate
    };
  }, [stats]);

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

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-neutral-night">Analytics</h1>
        <Card className="p-6 border-none bg-red-50 shadow-none">
          <p className="text-red-600">Error loading analytics data. Please try again later.</p>
          <button 
            onClick={() => refetch()} 
            className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  if (!currentMetrics || !stats) return null;

  // Prepare data for charts
  const trafficData = stats.map(day => ({
    name: day.day,
    pageViews: day.page_views,
    visitors: day.unique_visitors,
  }));

  const userJourneyData = stats.map(day => ({
    name: day.day,
    active: day.active_users,
    registered: day.registered_users,
    pro: day.pro_subscribers,
  }));

  const revenueData = stats.map(day => ({
    name: day.day,
    revenue: day.total_revenue,
    subscribers: day.pro_subscribers,
  }));

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 border-b border-neutral-border">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-night">Analytics</h1>
          <TimeRangeSelect value={timeRange} onChange={setTimeRange} />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`$${currentMetrics.total.total_revenue.toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}`}
          className="lg:col-span-2"
        />
        <StatCard
          title="Page Views"
          value={currentMetrics.total.page_views.toLocaleString()}
        />
        <StatCard
          title="Unique Visitors"
          value={currentMetrics.total.unique_visitors.toLocaleString()}
        />
        <StatCard
          title="Active Users"
          value={currentMetrics.total.active_users.toLocaleString()}
        />
        <StatCard
          title="Pro Users"
          value={currentMetrics.total.pro_subscribers.toLocaleString()}
        />
        <StatCard
          title="Registered Users"
          value={currentMetrics.total.registered_users.toLocaleString()}
        />
        <StatCard
          title="Conversion Rate"
          value={`${currentMetrics.conversionRate}%`}
        />
      </div>

      {/* Traffic Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Traffic Overview</h2>
          <div className="h-[300px]">
            <LineChart
              data={trafficData}
              categories={["pageViews", "visitors"]}
              index="name"
              colors={["#6851FB", "#37D299"]}
              valueFormatter={(value: number) => value.toLocaleString()}
              className="h-[300px]"
            />
          </div>
        </Card>

        {/* User Journey */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">User Journey</h2>
          <div className="h-[300px]">
            <LineChart
              data={userJourneyData}
              categories={["active", "registered", "pro"]}
              index="name"
              colors={["#F97316", "#FE28A2", "#6851FB"]}
              valueFormatter={(value: number) => value.toLocaleString()}
              className="h-[300px]"
            />
          </div>
        </Card>

        {/* Revenue Trends */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Revenue Trends</h2>
          <div className="h-[300px]">
            <BarChart
              data={revenueData}
              categories={["revenue"]}
              index="name"
              colors={["#6851FB"]}
              valueFormatter={(value: number) => `$${value.toLocaleString()}`}
              className="h-[300px]"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Analytics;
