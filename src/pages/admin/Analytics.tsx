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
import { TrendingUp, TrendingDown } from "lucide-react";

interface ImprovedAnalyticsStats {
  period: string;
  day: string;
  product_page_views: number;
  smart_link_views: number;
  unique_visitors: number;
  registered_users: number;
  active_users: number;
  pro_subscribers: number;
  total_revenue: number;
  smart_links_created: number;
  social_assets_created: number;
  meta_pixels_added: number;
  email_capture_enabled: number;
}

interface MonthlyActiveUsers {
  month: string;
  active_users: number;
  pro_users: number;
  total_users: number;
}

interface ProFeatureUsage {
  feature: string;
  count: number;
  percentage: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  className?: string;
}

const chartColors = {
  primary: "#6851FB",
  lighter: "#9B87F5",
  lightest: "#D0C7FF",
  darker: "#271153",
  darkest: "#180B33"
};

function StatCard({ title, value, change, className }: StatCardProps) {
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

  useEffect(() => {
    const range = timeRanges.find((r) => r.value === timeRange);
    if (range) {
      setStartDate(subDays(new Date(), range.days));
      setEndDate(new Date());
    }
  }, [timeRange]);

  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ["improved-analytics", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_improved_analytics_stats", {
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
      });

      if (error) {
        throw new Error(error.message);
      }

      return data as ImprovedAnalyticsStats[];
    },
  });

  const { data: monthlyUsers } = useQuery({
    queryKey: ["monthly-active-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_monthly_active_users");

      if (error) {
        throw new Error(error.message);
      }

      return data as MonthlyActiveUsers[];
    },
  });

  const { data: proFeatures } = useQuery({
    queryKey: ["pro-feature-usage"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_pro_feature_usage");

      if (error) {
        throw new Error(error.message);
      }

      return data as ProFeatureUsage[];
    },
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

  const currentMetrics = useMemo(() => {
    if (!stats || stats.length === 0) return null;

    const currentPeriodData = stats.filter(s => s.period === "current");
    const previousPeriodData = stats.filter(s => s.period === "previous");

    const totalProductPageViews = currentPeriodData.reduce((sum, stat) => sum + stat.product_page_views, 0);
    const totalSmartLinkViews = currentPeriodData.reduce((sum, stat) => sum + stat.smart_link_views, 0);
    const totalUniqueVisitors = currentPeriodData.reduce((sum, stat) => sum + stat.unique_visitors, 0);
    const totalRegisteredUsers = currentPeriodData.reduce((sum, stat) => sum + stat.registered_users, 0);
    const totalActiveUsers = currentPeriodData.reduce((sum, stat) => sum + stat.active_users, 0);
    const totalProSubscribers = currentPeriodData.reduce((sum, stat) => sum + stat.pro_subscribers, 0);
    const totalRevenue = currentPeriodData.reduce((sum, stat) => sum + stat.total_revenue, 0);
    const totalSmartLinksCreated = currentPeriodData.reduce((sum, stat) => sum + stat.smart_links_created, 0);
    const totalSocialAssetsCreated = currentPeriodData.reduce((sum, stat) => sum + stat.social_assets_created, 0);
    const totalMetaPixelsAdded = currentPeriodData.reduce((sum, stat) => sum + stat.meta_pixels_added, 0);
    const totalEmailCaptureEnabled = currentPeriodData.reduce((sum, stat) => sum + stat.email_capture_enabled, 0);

    const prevTotalProductPageViews = previousPeriodData.reduce((sum, stat) => sum + stat.product_page_views, 0);
    const prevTotalSmartLinkViews = previousPeriodData.reduce((sum, stat) => sum + stat.smart_link_views, 0);
    const prevTotalUniqueVisitors = previousPeriodData.reduce((sum, stat) => sum + stat.unique_visitors, 0);
    const prevTotalRegisteredUsers = previousPeriodData.reduce((sum, stat) => sum + stat.registered_users, 0);
    const prevTotalActiveUsers = previousPeriodData.reduce((sum, stat) => sum + stat.active_users, 0);
    const prevTotalProSubscribers = previousPeriodData.reduce((sum, stat) => sum + stat.pro_subscribers, 0);
    const prevTotalRevenue = previousPeriodData.reduce((sum, stat) => sum + stat.total_revenue, 0);
    const prevTotalSmartLinksCreated = previousPeriodData.reduce((sum, stat) => sum + stat.smart_links_created, 0);
    const prevTotalSocialAssetsCreated = previousPeriodData.reduce((sum, stat) => sum + stat.social_assets_created, 0);
    const prevTotalMetaPixelsAdded = previousPeriodData.reduce((sum, stat) => sum + stat.meta_pixels_added, 0);
    const prevTotalEmailCaptureEnabled = previousPeriodData.reduce((sum, stat) => sum + stat.email_capture_enabled, 0);

    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

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
      },
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
  }, [stats]);

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

  const trafficData = useMemo(() => {
    if (!stats) return [];
    return stats
      .filter(s => s.period === "current")
      .map(stat => ({
        date: formatDate(stat.day),
        "Product Page Views": stat.product_page_views,
        "Smart Link Views": stat.smart_link_views,
        "Unique Visitors": stat.unique_visitors,
      }));
  }, [stats]);

  const userJourneyData = useMemo(() => {
    if (!stats) return [];
    return stats
      .filter(s => s.period === "current")
      .map(stat => ({
        date: formatDate(stat.day),
        "Registered Users": stat.registered_users,
        "Active Users": stat.active_users,
        "Pro Subscribers": stat.pro_subscribers,
      }));
  }, [stats]);

  const revenueData = useMemo(() => {
    if (!stats) return [];
    return stats
      .filter(s => s.period === "current")
      .map(stat => ({
        date: formatDate(stat.day),
        "Revenue": stat.total_revenue,
      }));
  }, [stats]);

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
            <Card key={i} className="p-6 border-none bg-card/50 shadow-none animate-pulse">
              <div className="h-4 w-24 bg-muted rounded mb-2"></div>
              <div className="h-8 w-16 bg-muted rounded"></div>
            </Card>
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
            <h2 className="text-lg font-medium mb-2">Failed to load analytics data</h2>
            <p className="text-muted-foreground mb-4">There was an error loading the analytics data.</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Retry
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-foreground">Analytics</h1>
        <TimeRangeSelect value={timeRange} onChange={setTimeRange} />
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
          <StatCard
            title="Smart Links Created"
            value={currentMetrics?.smartLinksCreated.total.toLocaleString() || "0"}
            change={currentMetrics?.smartLinksCreated.trend}
          />
        </div>

        <ChartContainer className="mt-6" config={{
          grid: true,
          legend: true,
          xAxis: true,
          yAxis: true,
          aspectRatio: "3/2",
          tooltipType: "standard"
        }}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trafficData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <ChartTooltip formatter={(value) => value.toLocaleString()} />
              <Line type="monotone" dataKey="Product Page Views" stroke="#6851FB" />
              <Line type="monotone" dataKey="Smart Link Views" stroke="#9B87F5" />
              <Line type="monotone" dataKey="Unique Visitors" stroke="#D0C7FF" />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-primary-foreground">User Journey</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Registered Users"
            value={currentMetrics?.registeredUsers.total.toLocaleString() || "0"}
            change={currentMetrics?.registeredUsers.trend}
          />
          <StatCard
            title="Active Users"
            value={currentMetrics?.activeUsers.total.toLocaleString() || "0"}
            change={currentMetrics?.activeUsers.trend}
          />
          <StatCard
            title="Pro Subscribers"
            value={currentMetrics?.proSubscribers.total.toLocaleString() || "0"}
            change={currentMetrics?.proSubscribers.trend}
          />
          <StatCard
            title="Visitor to Registered"
            value={formatPercentage(currentMetrics?.visitorToRegisteredRate.total || 0)}
            change={currentMetrics?.visitorToRegisteredRate.trend}
          />
        </div>

        <ChartContainer className="mt-6" config={{
          grid: true,
          legend: true,
          xAxis: true,
          yAxis: true,
          aspectRatio: "3/2",
          tooltipType: "standard"
        }}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userJourneyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <ChartTooltip formatter={(value) => value.toLocaleString()} />
              <Line type="monotone" dataKey="Registered Users" stroke="#6851FB" />
              <Line type="monotone" dataKey="Active Users" stroke="#9B87F5" />
              <Line type="monotone" dataKey="Pro Subscribers" stroke="#D0C7FF" />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-primary-foreground">Revenue</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(currentMetrics?.revenue.total || 0)}
            change={currentMetrics?.revenue.trend}
          />
          <StatCard
            title="Registered to Pro"
            value={formatPercentage(currentMetrics?.registeredToProRate.total || 0)}
            change={currentMetrics?.registeredToProRate.trend}
          />
        </div>

        <ChartContainer className="mt-6" config={{
          grid: true,
          legend: true,
          xAxis: true,
          yAxis: true,
          aspectRatio: "3/2",
          tooltipType: "standard"
        }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <ChartTooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="Revenue" fill="#6851FB" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-primary-foreground">Pro Features Usage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Social Assets Created"
            value={currentMetrics?.socialAssetsCreated.total.toLocaleString() || "0"}
            change={currentMetrics?.socialAssetsCreated.trend}
          />
          <StatCard
            title="Meta Pixels Added"
            value={currentMetrics?.metaPixelsAdded.total.toLocaleString() || "0"}
            change={currentMetrics?.metaPixelsAdded.trend}
          />
          <StatCard
            title="Email Capture Enabled"
            value={currentMetrics?.emailCaptureEnabled.total.toLocaleString() || "0"}
            change={currentMetrics?.emailCaptureEnabled.trend}
          />
        </div>

        <ChartContainer className="mt-6" config={{
          grid: true,
          legend: true,
          xAxis: true,
          yAxis: true,
          aspectRatio: "3/2",
          tooltipType: "standard"
        }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={proFeaturesChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip formatter={(value, name, props) => [
                `${value} users (${props.payload.percentage.toFixed(1)}%)`,
                "Usage"
              ]} />
              <Bar dataKey="value" fill="#6851FB" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-primary-foreground">Monthly User Trends</h2>
        <ChartContainer config={{
          grid: true,
          legend: true,
          xAxis: true,
          yAxis: true,
          aspectRatio: "3/2",
          tooltipType: "standard"
        }}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyUsersChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip formatter={(value) => value.toLocaleString()} />
              <Line type="monotone" dataKey="Active Users" stroke="#6851FB" />
              <Line type="monotone" dataKey="Pro Users" stroke="#9B87F5" />
              <Line type="monotone" dataKey="Total Users" stroke="#D0C7FF" />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
}

export default Analytics;
