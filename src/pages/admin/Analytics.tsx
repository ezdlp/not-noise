
import { useQuery } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { TimeRangeSelect, TimeRangeValue, timeRanges } from "@/components/analytics/TimeRangeSelect";
import { ChartContainer, ChartTooltip, ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Json } from "@/integrations/supabase/types";

// Define the shape of the analytics data
interface AnalyticsBaseStats {
  period: string;
  day: string;
  product_page_views: number;
  smart_link_views: number;
  unique_visitors: number;
}

interface AnalyticsFullStats extends AnalyticsBaseStats {
  registered_users: number;
  active_users: number;
  pro_subscribers: number;
  total_revenue: number;
  smart_links_created: number;
  social_assets_created: number;
  meta_pixels_added: number;
  email_capture_enabled: number;
}

// Type guard to check if the data has the full stats properties
function isFullStatsData(data: any): data is AnalyticsFullStats {
  return (
    data &&
    typeof data === 'object' &&
    'registered_users' in data
  );
}

// Base metrics type - always available
interface BaseMetrics {
  productPageViews: { total: number; trend: number };
  smartLinkViews: { total: number; trend: number };
  uniqueVisitors: { total: number; trend: number };
}

// Full metrics type - available only in full stats mode
interface FullMetrics extends BaseMetrics {
  registeredUsers: { total: number; trend: number };
  activeUsers: { total: number; trend: number };
  proSubscribers: { total: number; trend: number };
  revenue: { total: number; trend: number };
  smartLinksCreated: { total: number; trend: number };
  socialAssetsCreated: { total: number; trend: number };
  metaPixelsAdded: { total: number; trend: number };
  emailCaptureEnabled: { total: number; trend: number };
  visitorToRegisteredRate: { total: number; trend: number };
  registeredToProRate: { total: number; trend: number };
}

type Metrics = BaseMetrics | FullMetrics;

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  className?: string;
  isLoading?: boolean;
}

const chartColors = {
  primary: "#6851FB",
  lighter: "#9B87F5",
  lightest: "#D0C7FF",
  darker: "#271153",
  darkest: "#180B33"
};

function StatCard({ title, value, change, className, isLoading }: StatCardProps) {
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
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <p className="text-2xl font-semibold text-primary-foreground">{value}</p>
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
  const [fallbackMode, setFallbackMode] = useState<boolean>(false);

  // Helper function to calculate trend - moved up here to fix the temporal dead zone issue
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
          console.warn("Cached analytics function failed:", cachedError);
          throw new Error(cachedError.message);
        }

        if (!data) {
          return [];
        }

        // Parse the returned JSON array
        let parsedData: (AnalyticsBaseStats | AnalyticsFullStats)[] = [];
        
        try {
          // The data should be a JSON array of stats objects
          if (typeof data === 'string') {
            parsedData = JSON.parse(data) as (AnalyticsBaseStats | AnalyticsFullStats)[];
          } else if (Array.isArray(data)) {
            // We need to explicitly cast the JSON data to our expected analytics types
            parsedData = data as unknown as (AnalyticsBaseStats | AnalyticsFullStats)[];
          }
        } catch (e) {
          console.error("Failed to parse analytics data:", e);
          return [];
        }

        // Check if we got full or basic stats by looking at the first item
        if (parsedData.length > 0) {
          if (isFullStatsData(parsedData[0])) {
            console.log("Got full stats data");
            setFallbackMode(false);
          } else {
            console.log("Got basic stats data");
            setFallbackMode(true);
          }
        }
        
        return parsedData;
      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
        toast.error("Failed to load analytics data. Please try again later.");
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000,
  });

  const { data: monthlyUsers } = useQuery({
    queryKey: ["monthly-active-users"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc("get_monthly_active_users");
        if (error) throw error;
        return data as { month: string; active_users: number; pro_users: number; total_users: number }[];
      } catch (error) {
        console.warn("Failed to fetch monthly users:", error);
        return [];
      }
    },
    enabled: !fallbackMode,
  });

  const { data: proFeatures } = useQuery({
    queryKey: ["pro-feature-usage"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc("get_pro_feature_usage");
        if (error) throw error;
        return data as { feature: string; count: number; percentage: number }[];
      } catch (error) {
        console.warn("Failed to fetch pro features:", error);
        return [];
      }
    },
    enabled: !fallbackMode,
  });

  useEffect(() => {
    const channel = supabase
      .channel("analytics-updates")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "page_views",
      }, () => {
        refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const currentMetrics = useMemo<Metrics | null>(() => {
    if (!cachedStats || cachedStats.length === 0) return null;

    const currentPeriodData = cachedStats.filter(s => s.period === "current");
    const previousPeriodData = cachedStats.filter(s => s.period === "previous");

    const totalProductPageViews = currentPeriodData.reduce((sum, stat) => sum + stat.product_page_views, 0);
    const totalSmartLinkViews = currentPeriodData.reduce((sum, stat) => sum + stat.smart_link_views, 0);
    const totalUniqueVisitors = currentPeriodData.reduce((sum, stat) => sum + stat.unique_visitors, 0);

    const prevTotalProductPageViews = previousPeriodData.reduce((sum, stat) => sum + stat.product_page_views, 0);
    const prevTotalSmartLinkViews = previousPeriodData.reduce((sum, stat) => sum + stat.smart_link_views, 0);
    const prevTotalUniqueVisitors = previousPeriodData.reduce((sum, stat) => sum + stat.unique_visitors, 0);

    // Base metrics available in both full and basic stats
    const baseMetrics: BaseMetrics = {
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
    
    // If we have full stats data, add the additional metrics
    if (!fallbackMode && currentPeriodData.length > 0 && isFullStatsData(currentPeriodData[0])) {
      const fullCurrentData = currentPeriodData.filter(isFullStatsData);
      const fullPreviousData = previousPeriodData.filter(isFullStatsData);
      
      const totalRegisteredUsers = fullCurrentData.reduce((sum, stat) => sum + stat.registered_users, 0);
      const totalActiveUsers = fullCurrentData.reduce((sum, stat) => sum + stat.active_users, 0);
      const totalProSubscribers = fullCurrentData.reduce((sum, stat) => sum + stat.pro_subscribers, 0);
      const totalRevenue = fullCurrentData.reduce((sum, stat) => sum + stat.total_revenue, 0);
      const totalSmartLinksCreated = fullCurrentData.reduce((sum, stat) => sum + stat.smart_links_created, 0);
      const totalSocialAssetsCreated = fullCurrentData.reduce((sum, stat) => sum + stat.social_assets_created, 0);
      const totalMetaPixelsAdded = fullCurrentData.reduce((sum, stat) => sum + stat.meta_pixels_added, 0);
      const totalEmailCaptureEnabled = fullCurrentData.reduce((sum, stat) => sum + stat.email_capture_enabled, 0);

      const prevTotalRegisteredUsers = fullPreviousData.reduce((sum, stat) => sum + stat.registered_users, 0);
      const prevTotalActiveUsers = fullPreviousData.reduce((sum, stat) => sum + stat.active_users, 0);
      const prevTotalProSubscribers = fullPreviousData.reduce((sum, stat) => sum + stat.pro_subscribers, 0);
      const prevTotalRevenue = fullPreviousData.reduce((sum, stat) => sum + stat.total_revenue, 0);
      const prevTotalSmartLinksCreated = fullPreviousData.reduce((sum, stat) => sum + stat.smart_links_created, 0);
      const prevTotalSocialAssetsCreated = fullPreviousData.reduce((sum, stat) => sum + stat.social_assets_created, 0);
      const prevTotalMetaPixelsAdded = fullPreviousData.reduce((sum, stat) => sum + stat.meta_pixels_added, 0);
      const prevTotalEmailCaptureEnabled = fullPreviousData.reduce((sum, stat) => sum + stat.email_capture_enabled, 0);

      const fullMetrics: FullMetrics = {
        ...baseMetrics,
        registeredUsers: {
          total: totalRegisteredUsers,
          trend: calculateTrend(totalRegisteredUsers, prevTotalRegisteredUsers),
        },
        activeUsers: {
          total: totalActiveUsers,
          trend: calculateTrend(totalActiveUsers, prevTotalActiveUsers),
        },
        proSubscribers: {
          total: totalProSubscribers,
          trend: calculateTrend(totalProSubscribers, prevTotalProSubscribers),
        },
        revenue: {
          total: totalRevenue,
          trend: calculateTrend(totalRevenue, prevTotalRevenue),
        },
        smartLinksCreated: {
          total: totalSmartLinksCreated,
          trend: calculateTrend(totalSmartLinksCreated, prevTotalSmartLinksCreated),
        },
        socialAssetsCreated: {
          total: totalSocialAssetsCreated,
          trend: calculateTrend(totalSocialAssetsCreated, prevTotalSocialAssetsCreated),
        },
        metaPixelsAdded: {
          total: totalMetaPixelsAdded,
          trend: calculateTrend(totalMetaPixelsAdded, prevTotalMetaPixelsAdded),
        },
        emailCaptureEnabled: {
          total: totalEmailCaptureEnabled,
          trend: calculateTrend(totalEmailCaptureEnabled, prevTotalEmailCaptureEnabled),
        },
        visitorToRegisteredRate: {
          total: totalUniqueVisitors > 0 ? (totalRegisteredUsers / totalUniqueVisitors) * 100 : 0,
          trend: calculateTrend(
            totalUniqueVisitors > 0 ? (totalRegisteredUsers / totalUniqueVisitors) * 100 : 0,
            prevTotalUniqueVisitors > 0 ? (prevTotalRegisteredUsers / prevTotalUniqueVisitors) * 100 : 0
          ),
        },
        registeredToProRate: {
          total: totalRegisteredUsers > 0 ? (totalProSubscribers / totalRegisteredUsers) * 100 : 0,
          trend: calculateTrend(
            totalRegisteredUsers > 0 ? (totalProSubscribers / totalRegisteredUsers) * 100 : 0,
            prevTotalRegisteredUsers > 0 ? (prevTotalProSubscribers / prevTotalRegisteredUsers) * 100 : 0
          ),
        },
      };
      return fullMetrics;
    }
    
    // Return only the base metrics for basic stats
    return baseMetrics;
  }, [cachedStats, fallbackMode]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Type guard to check if currentMetrics is FullMetrics
  const isFullMetrics = (metrics: Metrics | null): metrics is FullMetrics => {
    return metrics !== null && 'registeredUsers' in metrics;
  };

  const trafficData = useMemo(() => {
    if (!cachedStats) return [];
    return cachedStats
      .filter(s => s.period === "current")
      .map(stat => ({
        date: formatDate(stat.day),
        "Product Page Views": stat.product_page_views,
        "Smart Link Views": stat.smart_link_views,
        "Unique Visitors": stat.unique_visitors,
      }));
  }, [cachedStats]);

  const userJourneyData = useMemo(() => {
    if (!cachedStats || fallbackMode) return [];
    
    const fullStats = cachedStats.filter(s => s.period === "current" && isFullStatsData(s)) as AnalyticsFullStats[];
    
    return fullStats.map(stat => ({
      date: formatDate(stat.day),
      "Registered Users": stat.registered_users,
      "Active Users": stat.active_users,
      "Pro Subscribers": stat.pro_subscribers,
    }));
  }, [cachedStats, fallbackMode]);

  const revenueData = useMemo(() => {
    if (!cachedStats || fallbackMode) return [];
    
    const fullStats = cachedStats.filter(s => s.period === "current" && isFullStatsData(s)) as AnalyticsFullStats[];
    
    return fullStats.map(stat => ({
      date: formatDate(stat.day),
      "Revenue": stat.total_revenue,
    }));
  }, [cachedStats, fallbackMode]);

  const monthlyUsersChartData = useMemo(() => {
    if (!monthlyUsers) return [];
    return monthlyUsers.map(data => ({
      month: data.month,
      "Active Users": data.active_users,
      "Pro Users": data.pro_users,
      "Total Users": data.total_users,
    }));
  }, [monthlyUsers]);

  const proFeaturesChartData = useMemo(() => {
    if (!proFeatures) return [];
    return proFeatures.map(feature => ({
      name: feature.feature,
      value: feature.count,
      percentage: feature.percentage,
    }));
  }, [proFeatures]);

  const defaultChartConfig: ChartConfig = {
    grid: true,
    legend: true,
    xAxis: true,
    yAxis: true,
    aspectRatio: "3/2",
    tooltipType: "standard" as const
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <TimeRangeSelect value={timeRange} onChange={setTimeRange} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <StatCard key={i} isLoading={true} title="" value="" />
          ))}
        </div>
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
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-foreground">Analytics</h1>
        <div className="flex items-center gap-4">
          {fallbackMode && (
            <div className="flex items-center text-amber-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              Limited data available
            </div>
          )}
          <TimeRangeSelect value={timeRange} onChange={setTimeRange} />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-primary-foreground">Traffic</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Product Page Views"
            value={currentMetrics?.productPageViews.total.toLocaleString() || "0"}
            change={currentMetrics?.productPageViews.trend}
          />
          <StatCard
            title="Smart Link Views"
            value={currentMetrics?.smartLinkViews.total.toLocaleString() || "0"}
            change={currentMetrics?.smartLinkViews.trend}
          />
          <StatCard
            title="Unique Visitors"
            value={currentMetrics?.uniqueVisitors.total.toLocaleString() || "0"}
            change={currentMetrics?.uniqueVisitors.trend}
          />
          {!fallbackMode && isFullMetrics(currentMetrics) && (
            <StatCard
              title="Smart Links Created"
              value={currentMetrics.smartLinksCreated.total.toLocaleString() || "0"}
              change={currentMetrics.smartLinksCreated.trend}
            />
          )}
        </div>

        <ChartContainer className="mt-6" config={defaultChartConfig}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trafficData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <ChartTooltip formatter={(value: number) => value.toLocaleString()} />
              <Line type="monotone" dataKey="Product Page Views" stroke={chartColors.primary} />
              <Line type="monotone" dataKey="Smart Link Views" stroke={chartColors.lighter} />
              <Line type="monotone" dataKey="Unique Visitors" stroke={chartColors.lightest} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {!fallbackMode && isFullMetrics(currentMetrics) && (
        <>
          <div>
            <h2 className="text-xl font-semibold mb-4 text-primary-foreground">User Journey</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Registered Users"
                value={currentMetrics.registeredUsers.total.toLocaleString() || "0"}
                change={currentMetrics.registeredUsers.trend}
              />
              <StatCard
                title="Active Users"
                value={currentMetrics.activeUsers.total.toLocaleString() || "0"}
                change={currentMetrics.activeUsers.trend}
              />
              <StatCard
                title="Pro Subscribers"
                value={currentMetrics.proSubscribers.total.toLocaleString() || "0"}
                change={currentMetrics.proSubscribers.trend}
              />
              <StatCard
                title="Visitor to Registered"
                value={formatPercentage(currentMetrics.visitorToRegisteredRate.total || 0)}
                change={currentMetrics.visitorToRegisteredRate.trend}
              />
            </div>

            <ChartContainer className="mt-6" config={defaultChartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userJourneyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip formatter={(value: number) => value.toLocaleString()} />
                  <Line type="monotone" dataKey="Registered Users" stroke={chartColors.primary} />
                  <Line type="monotone" dataKey="Active Users" stroke={chartColors.lighter} />
                  <Line type="monotone" dataKey="Pro Subscribers" stroke={chartColors.lightest} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-primary-foreground">Revenue</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Revenue"
                value={formatCurrency(currentMetrics.revenue.total || 0)}
                change={currentMetrics.revenue.trend}
              />
              <StatCard
                title="Registered to Pro"
                value={formatPercentage(currentMetrics.registeredToProRate.total || 0)}
                change={currentMetrics.registeredToProRate.trend}
              />
            </div>

            <ChartContainer className="mt-6" config={defaultChartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip formatter={(value: number) => formatCurrency(Number(value))} />
                  <Bar dataKey="Revenue" fill={chartColors.primary} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-primary-foreground">Pro Features Usage</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Social Assets Created"
                value={currentMetrics.socialAssetsCreated.total.toLocaleString() || "0"}
                change={currentMetrics.socialAssetsCreated.trend}
              />
              <StatCard
                title="Meta Pixels Added"
                value={currentMetrics.metaPixelsAdded.total.toLocaleString() || "0"}
                change={currentMetrics.metaPixelsAdded.trend}
              />
              <StatCard
                title="Email Capture Enabled"
                value={currentMetrics.emailCaptureEnabled.total.toLocaleString() || "0"}
                change={currentMetrics.emailCaptureEnabled.trend}
              />
            </div>

            <ChartContainer className="mt-6" config={defaultChartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={proFeaturesChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip formatter={(value: number, name: string, props: any) => [
                    `${value} users (${props.payload.percentage.toFixed(1)}%)`,
                    "Usage"
                  ]} />
                  <Bar dataKey="value" fill={chartColors.primary} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-primary-foreground">Monthly User Trends</h2>
            <ChartContainer config={defaultChartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyUsersChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip formatter={(value: number) => value.toLocaleString()} />
                  <Line type="monotone" dataKey="Active Users" stroke={chartColors.primary} />
                  <Line type="monotone" dataKey="Pro Users" stroke={chartColors.lighter} />
                  <Line type="monotone" dataKey="Total Users" stroke={chartColors.lightest} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </>
      )}
    </div>
  );
}

export default Analytics;
