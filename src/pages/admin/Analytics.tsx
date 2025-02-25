import { useQuery } from "@tanstack/react-query";
import { subDays, format } from "date-fns";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { TimeRangeSelect, TimeRangeValue, timeRanges } from "@/components/analytics/TimeRangeSelect";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { 
  Bar, 
  BarChart, 
  Line, 
  LineChart, 
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip
} from "recharts";
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

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  }).format(value);

const formatPercent = (value: number) => 
  `${value.toFixed(2)}%`;

const formatDate = (date: string) => 
  format(new Date(date), 'MMM d');

function Analytics() {
  const [timeRange, setTimeRange] = useState<TimeRangeValue>('24h');
  
  const startDate = subDays(new Date(), timeRanges.find(r => r.value === timeRange)?.days || 1);

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

    const periodTotals = stats.reduce((acc, day) => ({
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

    const conversionRate = periodTotals.registered_users > 0 
      ? ((periodTotals.pro_subscribers / periodTotals.registered_users) * 100).toFixed(2)
      : "0.00";

    console.log('Period conversion rate calculation:', {
      timeRange,
      newRegisteredUsers: periodTotals.registered_users,
      newProSubscribers: periodTotals.pro_subscribers,
      conversionRate
    });

    return {
      latest: stats[stats.length - 1],
      total: periodTotals,
      conversionRate
    };
  }, [stats, timeRange]);

  const chartData = useMemo(() => {
    if (!stats || stats.length === 0) return null;

    return {
      traffic: stats.map(day => ({
        name: formatDate(day.day),
        pageViews: day.page_views,
        visitors: day.unique_visitors,
      })),
      userJourney: stats.map(day => ({
        name: formatDate(day.day),
        active: day.active_users,
        registered: day.registered_users,
        pro: day.pro_subscribers,
      })),
      revenue: stats.map(day => ({
        name: formatDate(day.day),
        revenue: day.total_revenue,
        subscribers: day.pro_subscribers,
      })),
      conversion: stats.map(day => ({
        name: formatDate(day.day),
        rate: day.registered_users > 0 
          ? (day.pro_subscribers / day.registered_users) * 100 
          : 0
      }))
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

  if (!currentMetrics || !stats || !chartData) return null;

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
          title="New Pro Users"
          value={currentMetrics.total.pro_subscribers.toLocaleString()}
        />
        <StatCard
          title="New Registered Users"
          value={currentMetrics.total.registered_users.toLocaleString()}
        />
        <StatCard
          title="Period Conversion Rate"
          value={`${currentMetrics.conversionRate}%`}
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
                  color: "#6851FB"
                },
                visitors: {
                  label: "Unique Visitors",
                  color: "#37D299"
                }
              }}
            >
              <ResponsiveContainer>
                <LineChart data={chartData.traffic}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
                  <XAxis 
                    dataKey="name"
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickLine={{ stroke: '#6B7280' }}
                    axisLine={{ stroke: '#6B7280' }}
                  />
                  <YAxis 
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickLine={{ stroke: '#6B7280' }}
                    axisLine={{ stroke: '#6B7280' }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="pageViews"
                    name="Page Views"
                    stroke="#6851FB"
                    strokeWidth={2}
                    dot={{ fill: '#6851FB', r: 4 }}
                    activeDot={{ r: 6, fill: '#6851FB' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="visitors"
                    name="Unique Visitors"
                    stroke="#37D299"
                    strokeWidth={2}
                    dot={{ fill: '#37D299', r: 4 }}
                    activeDot={{ r: 6, fill: '#37D299' }}
                  />
                </LineChart>
              </ResponsiveContainer>
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
                  color: "#F97316"
                },
                registered: {
                  label: "Registered Users",
                  color: "#FE28A2"
                },
                pro: {
                  label: "Pro Users",
                  color: "#6851FB"
                }
              }}
            >
              <ResponsiveContainer>
                <LineChart data={chartData.userJourney}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
                  <XAxis 
                    dataKey="name"
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickLine={{ stroke: '#6B7280' }}
                    axisLine={{ stroke: '#6B7280' }}
                  />
                  <YAxis 
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickLine={{ stroke: '#6B7280' }}
                    axisLine={{ stroke: '#6B7280' }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="active"
                    name="Active Users"
                    stroke="#F97316"
                    strokeWidth={2}
                    dot={{ fill: '#F97316', r: 4 }}
                    activeDot={{ r: 6, fill: '#F97316' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="registered"
                    name="Registered Users"
                    stroke="#FE28A2"
                    strokeWidth={2}
                    dot={{ fill: '#FE28A2', r: 4 }}
                    activeDot={{ r: 6, fill: '#FE28A2' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pro"
                    name="Pro Users"
                    stroke="#6851FB"
                    strokeWidth={2}
                    dot={{ fill: '#6851FB', r: 4 }}
                    activeDot={{ r: 6, fill: '#6851FB' }}
                  />
                </LineChart>
              </ResponsiveContainer>
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
                  color: "#6851FB"
                }
              }}
            >
              <ResponsiveContainer>
                <BarChart data={chartData.revenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
                  <XAxis 
                    dataKey="name"
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickLine={{ stroke: '#6B7280' }}
                    axisLine={{ stroke: '#6B7280' }}
                  />
                  <YAxis 
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickLine={{ stroke: '#6B7280' }}
                    axisLine={{ stroke: '#6B7280' }}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip 
                    content={<ChartTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                    />} 
                  />
                  <Legend />
                  <Bar 
                    dataKey="revenue"
                    name="Revenue"
                    fill="#6851FB"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Conversion Rate Over Time</h2>
          <div className="h-[300px]">
            <ChartContainer 
              className="h-[300px]"
              config={{
                rate: {
                  label: "Conversion Rate",
                  color: "#6851FB"
                }
              }}
            >
              <ResponsiveContainer>
                <AreaChart data={chartData.conversion}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6851FB" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6851FB" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
                  <XAxis 
                    dataKey="name"
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickLine={{ stroke: '#6B7280' }}
                    axisLine={{ stroke: '#6B7280' }}
                  />
                  <YAxis 
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickLine={{ stroke: '#6B7280' }}
                    axisLine={{ stroke: '#6B7280' }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    content={<ChartTooltip 
                      formatter={(value: number) => formatPercent(value)}
                    />} 
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    name="Conversion Rate"
                    stroke="#6851FB"
                    fillOpacity={1}
                    fill="url(#colorRate)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Analytics;
