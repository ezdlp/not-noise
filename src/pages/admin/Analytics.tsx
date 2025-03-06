
import { useQuery } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { TimeRangeSelect, TimeRangeValue, timeRanges } from "@/components/analytics/TimeRangeSelect";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, AlertCircle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Json } from "supabase/functions/_shared/database.types";

interface AnalyticsStats {
  period: string;
  day: string;
  product_page_views: number;
  smart_link_views: number;
  unique_visitors: number;
}

interface BaseMetrics {
  productPageViews: { total: number; trend: number };
  smartLinkViews: { total: number; trend: number };
  uniqueVisitors: { total: number; trend: number };
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  className?: string;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

interface AnalyticsLog {
  id: string;
  function_name: string;
  parameters: any;
  status: string;
  details: any;
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  created_at: string;
}

const chartColors = {
  primary: "#6851FB",
  secondary: "#37D299",
  tertiary: "#FE28A2",
  background: "#ECE9FF"
};

function StatCard({ title, value, change, className, isLoading, icon }: StatCardProps) {
  if (isLoading) {
    return (
      <Card className={cn("p-6 border border-[#E6E6E6] bg-white rounded-lg shadow-sm animate-pulse", className)}>
        <div className="h-4 w-24 bg-muted rounded mb-2"></div>
        <div className="h-8 w-16 bg-muted rounded"></div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-6 border border-[#E6E6E6] bg-white rounded-lg shadow-sm", className)}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <p className="text-2xl font-semibold text-primary-foreground">{value}</p>
        </div>
        {icon && (
          <div className="bg-[#ECE9FF] p-2 rounded-full">
            {icon}
          </div>
        )}
      </div>
      {change !== undefined && (
        <div className="flex items-center gap-1 mt-1">
          {change > 0 ? (
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          ) : change < 0 ? (
            <TrendingDown className="w-4 h-4 text-red-600" />
          ) : null}
          <p className={cn(
            "text-xs",
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
  const [timeRange, setTimeRange] = useState<TimeRangeValue>("7d");
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  useEffect(() => {
    const range = timeRanges.find((r) => r.value === timeRange);
    if (range) {
      setStartDate(subDays(new Date(), range.days));
      setEndDate(new Date());
    }
  }, [timeRange]);

  const { data: cachedStats, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["analytics-stats", startDate, endDate],
    queryFn: async () => {
      try {
        console.log("Fetching analytics data with cached function...");
        const { data, error: cachedError } = await supabase.rpc("get_cached_analytics_stats", {
          p_start_date: startDate.toISOString(),
          p_end_date: endDate.toISOString(),
          p_cache_minutes: 60
        });

        if (cachedError) {
          console.error("Cached analytics function failed:", cachedError);
          throw new Error(cachedError.message);
        }

        if (!data || !Array.isArray(data) || data.length === 0) {
          console.log("No data returned from analytics function");
          return [];
        }

        console.log("Raw data from function:", data);
        return data as AnalyticsStats[];
      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
        toast.error("Failed to load analytics data. Please try again later.");
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000,
  });

  const { data: analyticsLogs } = useQuery({
    queryKey: ["analytics-logs-data"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('analytics_function_logs')
          .select('*')
          .order('start_time', { ascending: false })
          .limit(10);
        
        if (error) throw error;
        return data as unknown as AnalyticsLog[];
      } catch (error) {
        console.warn("Failed to fetch analytics logs:", error);
        return [];
      }
    },
    enabled: isError,
  });

  const currentMetrics = useMemo<BaseMetrics | null>(() => {
    if (!cachedStats || cachedStats.length === 0) {
      console.warn("No cached stats available for metrics calculation");
      return null;
    }

    console.log("Calculating metrics from", cachedStats.length, "data points");
    
    const currentPeriodData = cachedStats.filter(s => s.period === "current");
    const previousPeriodData = cachedStats.filter(s => s.period === "previous");
    
    console.log("Current period data points:", currentPeriodData.length);
    console.log("Previous period data points:", previousPeriodData.length);

    if (currentPeriodData.length === 0) {
      console.warn("No current period data available");
      return null;
    }

    const totalProductPageViews = currentPeriodData.reduce((sum, stat) => sum + (Number(stat.product_page_views) || 0), 0);
    const totalSmartLinkViews = currentPeriodData.reduce((sum, stat) => sum + (Number(stat.smart_link_views) || 0), 0);
    const totalUniqueVisitors = currentPeriodData.reduce((sum, stat) => sum + (Number(stat.unique_visitors) || 0), 0);

    const prevTotalProductPageViews = previousPeriodData.reduce((sum, stat) => sum + (Number(stat.product_page_views) || 0), 0);
    const prevTotalSmartLinkViews = previousPeriodData.reduce((sum, stat) => sum + (Number(stat.smart_link_views) || 0), 0);
    const prevTotalUniqueVisitors = previousPeriodData.reduce((sum, stat) => sum + (Number(stat.unique_visitors) || 0), 0);

    return {
      productPageViews: {
        total: totalProductPageViews,
        trend: calculateTrend(totalProductPageViews, prevTotalProductPageViews),
      },
      smartLinkViews: {
        total: totalSmartLinkViews,
        trend: calculateTrend(totalSmartLinkViews, prevTotalSmartLinkViews),
      },
      uniqueVisitors: {
        total: totalUniqueVisitors,
        trend: calculateTrend(totalUniqueVisitors, prevTotalUniqueVisitors),
      }
    };
  }, [cachedStats]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const trafficData = useMemo(() => {
    if (!cachedStats || cachedStats.length === 0) return [];
    
    const currentData = cachedStats.filter(s => s.period === "current");
    if (currentData.length === 0) return [];
    
    return currentData.map(stat => ({
      date: formatDate(stat.day),
      "Product Views": Number(stat.product_page_views) || 0,
      "Smart Link Views": Number(stat.smart_link_views) || 0,
      "Unique Visitors": Number(stat.unique_visitors) || 0,
    }));
  }, [cachedStats]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <TimeRangeSelect value={timeRange} onChange={setTimeRange} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatCard key={i} isLoading={true} title="" value="" />
          ))}
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <TimeRangeSelect value={timeRange} onChange={setTimeRange} />
        </div>
        <Card className="p-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-medium mb-2">Failed to load analytics data</h2>
            <p className="text-muted-foreground mb-4">There was an error loading the analytics data.</p>
            <p className="text-sm text-red-500 mb-4">{error instanceof Error ? error.message : "Unknown error"}</p>
            <Button
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Retry
            </Button>

            {analyticsLogs && analyticsLogs.length > 0 && (
              <div className="mt-8 text-left">
                <h3 className="text-md font-medium mb-2">Recent Function Logs</h3>
                <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-[300px]">
                  {analyticsLogs.map((log: AnalyticsLog) => (
                    <div key={log.id} className="mb-4 border-b pb-2 text-xs">
                      <div className="flex justify-between">
                        <span className="font-medium">{log.function_name}</span>
                        <span className={
                          log.status === 'success' ? 'text-green-500' : 
                          log.status === 'error' ? 'text-red-500' : 'text-orange-500'
                        }>{log.status}</span>
                      </div>
                      <div>Duration: {log.duration_ms?.toFixed(2)}ms</div>
                      <div>Start: {new Date(log.start_time).toLocaleString()}</div>
                      {log.details && (
                        <pre className="whitespace-pre-wrap mt-1 bg-gray-100 p-1 rounded text-xs">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (!cachedStats || cachedStats.length === 0 || !currentMetrics) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <TimeRangeSelect value={timeRange} onChange={setTimeRange} />
        </div>
        <Card className="p-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-medium mb-2">No analytics data available</h2>
            <p className="text-muted-foreground mb-4">
              There is no analytics data available for the selected time period.
            </p>
            <Button
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Refresh
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <TimeRangeSelect value={timeRange} onChange={setTimeRange} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Traffic Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Product Page Views"
            value={currentMetrics.productPageViews.total.toLocaleString()}
            change={currentMetrics.productPageViews.trend}
            icon={<BarChart3 className="h-5 w-5 text-primary" />}
          />
          <StatCard
            title="Smart Link Views"
            value={currentMetrics.smartLinkViews.total.toLocaleString()}
            change={currentMetrics.smartLinkViews.trend}
            icon={<BarChart3 className="h-5 w-5 text-[#37D299]" />}
          />
          <StatCard
            title="Unique Visitors"
            value={currentMetrics.uniqueVisitors.total.toLocaleString()}
            change={currentMetrics.uniqueVisitors.trend}
            icon={<BarChart3 className="h-5 w-5 text-[#FE28A2]" />}
          />
        </div>

        {trafficData.length > 0 && (
          <ChartContainer className="mt-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trafficData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E6E6" opacity={0.4} />
                <XAxis 
                  dataKey="date" 
                  stroke="#374151"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#374151"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #E6E6E6',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{ padding: '2px 0' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Product Views" 
                  stroke={chartColors.primary}
                  strokeWidth={2}
                  dot={{ r: 3, fill: chartColors.primary }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Smart Link Views" 
                  stroke={chartColors.secondary}
                  strokeWidth={2}
                  dot={{ r: 3, fill: chartColors.secondary }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Unique Visitors" 
                  stroke={chartColors.tertiary}
                  strokeWidth={2}
                  dot={{ r: 3, fill: chartColors.tertiary }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Daily Breakdown</h2>
        <ChartContainer>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trafficData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E6E6E6" opacity={0.4} vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#374151"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#374151"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #E6E6E6',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                itemStyle={{ padding: '2px 0' }}
              />
              <Bar 
                dataKey="Product Views" 
                fill={chartColors.primary}
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="Smart Link Views" 
                fill={chartColors.secondary} 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="Unique Visitors" 
                fill={chartColors.tertiary}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
}

export default Analytics;
