
import { useQuery } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { TimeRangeSelect, TimeRangeValue, timeRanges } from "@/components/analytics/TimeRangeSelect";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface AnalyticsStats {
  period: string;
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

const chartColors = {
  primary: "#6851FB",    // Majorelle Blue (Base)
  lighter: "#9B87F5",    // 20% lighter
  lightest: "#D0C7FF",   // 40% lighter
  darker: "#271153",     // 20% darker
  darkest: "#180B33"     // 40% darker
};

function StatCard({ title, value, change, className }: StatCardProps) {
  return (
    <Card className={cn("p-6 border-none bg-card/50 shadow-none", className)}>
      <h3 className="font-medium text-muted-foreground">{title}</h3>
      <p className="text-2xl font-bold text-neutral-night">{value}</p>
      {change !== undefined && (
        <div className="flex items-center gap-1 mt-1">
          {change > 0 ? (
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          ) : change < 0 ? (
            <TrendingDown className="w-4 h-4 text-red-600" />
          ) : null}
          <p className={cn(
            "text-sm",
            change > 0 ? "text-emerald-600" : change < 0 ? "text-red-600" : "text-muted-foreground"
          )}>
            {change > 0 ? "+" : ""}{change.toFixed(1)}%
          </p>
        </div>
      )}
    </Card>
  );
}

function Analytics() {
  const [timeRange, setTimeRange] = useState<TimeRangeValue>('7d'); // Changed default to 7d
  
  const startDate = subDays(new Date(), timeRanges.find(r => r.value === timeRange)?.days || 7);

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ["analytics", timeRange],
    queryFn: async () => {
      console.log('Fetching analytics stats for date range:', startDate.toISOString());
      const { data, error } = await supabase.rpc("get_analytics_stats_with_trends", {
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

    const currentPeriodData = stats.filter(stat => stat.period === 'current');
    const previousPeriodData = stats.filter(stat => stat.period === 'previous');

    const calculateTotal = (data: AnalyticsStats[], metric: keyof AnalyticsStats) => {
      return data.reduce((acc, day) => acc + (day[metric] as number), 0);
    };

    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const currentTotals = {
      page_views: calculateTotal(currentPeriodData, 'page_views'),
      unique_visitors: calculateTotal(currentPeriodData, 'unique_visitors'),
      registered_users: calculateTotal(currentPeriodData, 'registered_users'),
      active_users: calculateTotal(currentPeriodData, 'active_users'),
      pro_subscribers: calculateTotal(currentPeriodData, 'pro_subscribers'),
      total_revenue: calculateTotal(currentPeriodData, 'total_revenue'),
    };

    const previousTotals = {
      page_views: calculateTotal(previousPeriodData, 'page_views'),
      unique_visitors: calculateTotal(previousPeriodData, 'unique_visitors'),
      registered_users: calculateTotal(previousPeriodData, 'registered_users'),
      active_users: calculateTotal(previousPeriodData, 'active_users'),
      pro_subscribers: calculateTotal(previousPeriodData, 'pro_subscribers'),
      total_revenue: calculateTotal(previousPeriodData, 'total_revenue'),
    };

    const trends = {
      page_views: calculateTrend(currentTotals.page_views, previousTotals.page_views),
      unique_visitors: calculateTrend(currentTotals.unique_visitors, previousTotals.unique_visitors),
      registered_users: calculateTrend(currentTotals.registered_users, previousTotals.registered_users),
      active_users: calculateTrend(currentTotals.active_users, previousTotals.active_users),
      pro_subscribers: calculateTrend(currentTotals.pro_subscribers, previousTotals.pro_subscribers),
      total_revenue: calculateTrend(currentTotals.total_revenue, previousTotals.total_revenue),
    };

    const currentConversionRate = currentTotals.registered_users > 0 
      ? ((currentTotals.pro_subscribers / currentTotals.registered_users) * 100)
      : 0;
    
    const previousConversionRate = previousTotals.registered_users > 0 
      ? ((previousTotals.pro_subscribers / previousTotals.registered_users) * 100)
      : 0;

    return {
      latest: currentPeriodData[currentPeriodData.length - 1],
      total: currentTotals,
      trends,
      conversionRate: currentConversionRate.toFixed(2),
      conversionTrend: calculateTrend(currentConversionRate, previousConversionRate)
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const trafficData = stats
    .filter(stat => stat.period === 'current')
    .map(day => ({
      name: formatDate(day.day),
      pageViews: day.page_views,
      visitors: day.unique_visitors,
    }));

  const userJourneyData = stats
    .filter(stat => stat.period === 'current')
    .map(day => ({
      name: formatDate(day.day),
      active: day.active_users,
      registered: day.registered_users,
      pro: day.pro_subscribers,
    }));

  const revenueData = stats
    .filter(stat => stat.period === 'current')
    .map(day => ({
      name: formatDate(day.day),
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(currentMetrics.total.total_revenue)}
          change={currentMetrics.trends.total_revenue}
          className="lg:col-span-2"
        />
        <StatCard
          title="Page Views"
          value={currentMetrics.total.page_views.toLocaleString()}
          change={currentMetrics.trends.page_views}
        />
        <StatCard
          title="Unique Visitors"
          value={currentMetrics.total.unique_visitors.toLocaleString()}
          change={currentMetrics.trends.unique_visitors}
        />
        <StatCard
          title="Active Users"
          value={currentMetrics.total.active_users.toLocaleString()}
          change={currentMetrics.trends.active_users}
        />
        <StatCard
          title="New Pro Users"
          value={currentMetrics.total.pro_subscribers.toLocaleString()}
          change={currentMetrics.trends.pro_subscribers}
        />
        <StatCard
          title="New Registered Users"
          value={currentMetrics.total.registered_users.toLocaleString()}
          change={currentMetrics.trends.registered_users}
        />
        <StatCard
          title="Period Conversion Rate"
          value={`${currentMetrics.conversionRate}%`}
          change={currentMetrics.conversionTrend}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Traffic Overview</h2>
          <div className="h-[300px]">
            <ChartContainer 
              className="h-[300px]"
              config={{
                pageViews: {
                  label: "Page Views",
                  color: chartColors.primary
                },
                visitors: {
                  label: "Unique Visitors",
                  color: chartColors.lighter
                }
              }}
            >
              <LineChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E6E6" />
                <XAxis 
                  dataKey="name"
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#E6E6E6' }}
                />
                <YAxis
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#E6E6E6' }}
                  tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value)}
                />
                <ChartTooltip />
                <Line 
                  type="monotone"
                  dataKey="pageViews"
                  stroke={chartColors.primary}
                  strokeWidth={2}
                  dot={{ fill: chartColors.primary, r: 4 }}
                  activeDot={{ r: 6, fill: chartColors.primary }}
                />
                <Line 
                  type="monotone"
                  dataKey="visitors"
                  stroke={chartColors.lighter}
                  strokeWidth={2}
                  dot={{ fill: chartColors.lighter, r: 4 }}
                  activeDot={{ r: 6, fill: chartColors.lighter }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">User Journey</h2>
          <div className="h-[300px]">
            <ChartContainer 
              className="h-[300px]"
              config={{
                active: {
                  label: "Active Users",
                  color: chartColors.darker
                },
                registered: {
                  label: "Registered Users",
                  color: chartColors.primary
                },
                pro: {
                  label: "Pro Users",
                  color: chartColors.lighter
                }
              }}
            >
              <LineChart data={userJourneyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E6E6" />
                <XAxis 
                  dataKey="name"
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#E6E6E6' }}
                />
                <YAxis
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#E6E6E6' }}
                  tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value)}
                />
                <ChartTooltip />
                <Line 
                  type="monotone"
                  dataKey="active"
                  stroke={chartColors.darker}
                  strokeWidth={2}
                  dot={{ fill: chartColors.darker, r: 4 }}
                  activeDot={{ r: 6, fill: chartColors.darker }}
                />
                <Line 
                  type="monotone"
                  dataKey="registered"
                  stroke={chartColors.primary}
                  strokeWidth={2}
                  dot={{ fill: chartColors.primary, r: 4 }}
                  activeDot={{ r: 6, fill: chartColors.primary }}
                />
                <Line 
                  type="monotone"
                  dataKey="pro"
                  stroke={chartColors.lighter}
                  strokeWidth={2}
                  dot={{ fill: chartColors.lighter, r: 4 }}
                  activeDot={{ r: 6, fill: chartColors.lighter }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Revenue Trends</h2>
          <div className="h-[300px]">
            <ChartContainer 
              className="h-[300px]"
              config={{
                revenue: {
                  label: "Revenue",
                  color: chartColors.primary
                }
              }}
            >
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E6E6" />
                <XAxis 
                  dataKey="name"
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#E6E6E6' }}
                />
                <YAxis
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#E6E6E6' }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <ChartTooltip 
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Bar 
                  dataKey="revenue"
                  fill={chartColors.primary}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Analytics;
