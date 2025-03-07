
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import { ArrowRight, FileSpreadsheet } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

// Define types for Analytics data
interface AnalyticsStats {
  period: string;
  day: string;
  product_page_views: number;
  smart_link_views: number;
  unique_visitors: number;
  registered_users: number;
  active_users: number;
  pro_subscribers: number;
  total_revenue: number;
}

interface AnalyticsData {
  today: AnalyticsStats;
  yesterday: AnalyticsStats;
  weekly: AnalyticsStats[];
  monthly: AnalyticsStats[];
  trends: {
    visitors: number;
    revenue: number;
    users: number;
  };
}

const Analytics = () => {
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly'>('weekly');

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics-data'],
    queryFn: async () => {
      try {
        // Fetch analytics dashboard stats
        const { data: dashboardStats, error: statsError } = await supabase.rpc('get_analytics_dashboard_stats');
        
        if (statsError) throw statsError;

        // Convert to expected format
        const processedData: AnalyticsData = {
          today: {
            period: 'today',
            day: new Date().toISOString().split('T')[0],
            product_page_views: 0,
            smart_link_views: 0,
            unique_visitors: 0,
            registered_users: 0,
            active_users: 0,
            pro_subscribers: 0,
            total_revenue: 0,
          },
          yesterday: {
            period: 'yesterday',
            day: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            product_page_views: 0,
            smart_link_views: 0,
            unique_visitors: 0,
            registered_users: 0,
            active_users: 0,
            pro_subscribers: 0,
            total_revenue: 0,
          },
          weekly: [],
          monthly: [],
          trends: {
            visitors: 0,
            revenue: 0,
            users: 0,
          }
        };

        // Process the data from the get_analytics_dashboard_stats function
        if (Array.isArray(dashboardStats)) {
          const currentPeriod = dashboardStats.find(period => period.period === 'current');
          const previousPeriod = dashboardStats.find(period => period.period === 'previous');
          
          if (currentPeriod && previousPeriod) {
            // Get the RPC data for analytics_stats_with_trends for time series data
            const { data: timeSeriesData, error: timeSeriesError } = await supabase.rpc('get_analytics_stats');
            
            if (timeSeriesError) throw timeSeriesError;

            // Extract data for the charts
            if (Array.isArray(timeSeriesData)) {
              const weekly = timeSeriesData.slice(0, 7).map((day: any) => ({
                period: 'weekly',
                day: day.day,
                product_page_views: day.page_views || 0,
                smart_link_views: day.smart_link_views || 0,
                unique_visitors: day.unique_visitors || 0,
                registered_users: day.registered_users || 0,
                active_users: day.active_users || 0,
                pro_subscribers: day.pro_subscribers || 0,
                total_revenue: day.total_revenue || 0,
              }));
              
              const monthly = timeSeriesData.slice(0, 30).map((day: any) => ({
                period: 'monthly',
                day: day.day,
                product_page_views: day.page_views || 0,
                smart_link_views: day.smart_link_views || 0,
                unique_visitors: day.unique_visitors || 0,
                registered_users: day.registered_users || 0,
                active_users: day.active_users || 0,
                pro_subscribers: day.pro_subscribers || 0,
                total_revenue: day.total_revenue || 0,
              }));
              
              processedData.weekly = weekly;
              processedData.monthly = monthly;
              
              if (weekly.length > 0) {
                processedData.today = weekly[0];
                processedData.yesterday = weekly[1] || processedData.yesterday;
              }
              
              // Calculate trends
              processedData.trends.visitors = calculateTrend(
                currentPeriod.product_visits + currentPeriod.smart_link_visits,
                previousPeriod.product_visits + previousPeriod.smart_link_visits
              );
              
              processedData.trends.revenue = calculateTrend(
                currentPeriod.revenue, 
                previousPeriod.revenue
              );
              
              processedData.trends.users = calculateTrend(
                currentPeriod.signups, 
                previousPeriod.signups
              );
            }
          }
        }
        
        return processedData;
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        throw error;
      }
    }
  });

  // Fetch pro feature usage data
  const { data: proFeatureUsage, isLoading: isFeatureUsageLoading } = useQuery({
    queryKey: ['analytics-feature-usage'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_analytics_dashboard_stats');
        
        if (error) throw error;
        
        const current = data?.find((d: any) => d.period === 'current');
        
        return {
          social_cards: current?.social_cards_usage || 0,
          meta_pixel: current?.meta_pixel_usage || 0,
          email_capture: current?.email_capture_usage || 0
        };
      } catch (error) {
        console.error('Error fetching pro feature usage:', error);
        return {
          social_cards: 0,
          meta_pixel: 0,
          email_capture: 0
        };
      }
    }
  });

  // Fetch recent function logs
  const { data: recentLogs, isLoading: isLogsLoading } = useQuery({
    queryKey: ['analytics-recent-logs'],
    queryFn: async () => {
      try {
        // Fetch from analytics_events as a fallback
        const { data, error } = await supabase
          .from('analytics_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (error) throw error;
        
        // Convert to expected format
        const logs = data.map((log: any) => ({
          id: log.id || `id-${Math.random()}`,
          created_at: log.created_at || new Date().toISOString(),
          function_name: log.event_type || 'analytics',
          status: 'success' as const,
          execution_time_ms: 0
        }));
        
        return logs;
      } catch (error) {
        console.error('Error fetching recent logs:', error);
        return [];
      }
    }
  });

  // Fetch monthly active users trend
  const { data: mauTrend, isLoading: isMauLoading } = useQuery({
    queryKey: ['analytics-mau-trend'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_monthly_active_users_trend');
        
        if (error) throw error;
        
        return data;
      } catch (error) {
        console.error('Error fetching MAU trend:', error);
        return [];
      }
    }
  });

  // Helper to calculate trend percentage
  const calculateTrend = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const renderTrendIndicator = (value: number) => {
    if (value > 0) {
      return <span className="text-success-DEFAULT">↑ {value.toFixed(1)}%</span>;
    } else if (value < 0) {
      return <span className="text-destructive">↓ {Math.abs(value).toFixed(1)}%</span>;
    }
    return <span className="text-muted-foreground">0%</span>;
  };

  const chartData = timeRange === 'weekly' 
    ? analyticsData?.weekly?.slice().reverse() 
    : analyticsData?.monthly?.slice().reverse();

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <Button variant="outline" asChild>
          <Link to="/control-room/analytics/logs">
            View Function Logs
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Key metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Unique Visitors" 
          value={isLoading ? null : formatNumber(analyticsData?.today.unique_visitors || 0)} 
          trend={isLoading ? null : analyticsData?.trends.visitors}
          description="Today"
        />
        <StatCard 
          title="Page Views" 
          value={isLoading ? null : formatNumber(analyticsData?.today.product_page_views + (analyticsData?.today.smart_link_views || 0))} 
          description="Today"
        />
        <StatCard 
          title="Active Users" 
          value={isLoading ? null : formatNumber(analyticsData?.today.active_users || 0)} 
          trend={isLoading ? null : analyticsData?.trends.users}
          description="Today"
        />
        <StatCard 
          title="Revenue" 
          value={isLoading ? null : formatCurrency(analyticsData?.today.total_revenue || 0)} 
          trend={isLoading ? null : analyticsData?.trends.revenue}
          description="Today"
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="visitors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="visitors">Visitors</TabsTrigger>
          <TabsTrigger value="pageviews">Page Views</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <div className="flex justify-end mb-2">
          <TabsList>
            <TabsTrigger 
              value="weekly" 
              onClick={() => setTimeRange('weekly')}
              data-state={timeRange === 'weekly' ? 'active' : ''}
            >
              Weekly
            </TabsTrigger>
            <TabsTrigger 
              value="monthly"
              onClick={() => setTimeRange('monthly')}
              data-state={timeRange === 'monthly' ? 'active' : ''}
            >
              Monthly
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="visitors" className="space-y-4">
          <ChartContainer className="h-[400px]">
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Skeleton className="h-[300px] w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="visitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="day" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="unique_visitors" 
                    name="Unique Visitors"
                    stroke="hsl(var(--chart-1))" 
                    fillOpacity={1} 
                    fill="url(#visitors)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </TabsContent>

        <TabsContent value="pageviews" className="space-y-4">
          <ChartContainer className="h-[400px]">
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Skeleton className="h-[300px] w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="pageviews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="smartlinks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="day" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="product_page_views" 
                    name="Product Page Views"
                    stroke="hsl(var(--chart-1))" 
                    fillOpacity={1} 
                    fill="url(#pageviews)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="smart_link_views" 
                    name="Smart Link Views"
                    stroke="hsl(var(--chart-2))" 
                    fillOpacity={1} 
                    fill="url(#smartlinks)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <ChartContainer className="h-[400px]">
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Skeleton className="h-[300px] w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="registered" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="active" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="pro" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="day" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="registered_users" 
                    name="New Registrations"
                    stroke="hsl(var(--chart-1))" 
                    fillOpacity={1} 
                    fill="url(#registered)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="active_users" 
                    name="Active Users"
                    stroke="hsl(var(--chart-2))" 
                    fillOpacity={1} 
                    fill="url(#active)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pro_subscribers" 
                    name="Pro Subscribers"
                    stroke="hsl(var(--chart-3))" 
                    fillOpacity={1} 
                    fill="url(#pro)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <ChartContainer className="h-[400px]">
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Skeleton className="h-[300px] w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="day" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${value}`}
                  />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip 
                    content={<ChartTooltip formatter={(value) => `$${value}`} />}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="total_revenue" 
                    name="Revenue"
                    stroke="hsl(var(--chart-1))" 
                    fillOpacity={1} 
                    fill="url(#revenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </TabsContent>
      </Tabs>

      {/* Recent Function Logs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Function Logs</CardTitle>
            <CardDescription>Last 5 function calls and their status</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/control-room/analytics/logs">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              View All Logs
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLogsLoading ? (
            <div className="space-y-2">
              {Array(5).fill(null).map((_, i) => (
                <Skeleton key={i} className="w-full h-8" />
              ))}
            </div>
          ) : recentLogs && recentLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Function</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time (ms)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                    <TableCell>{log.function_name}</TableCell>
                    <TableCell>
                      <span className={log.status === 'success' ? 'text-success-DEFAULT' : 'text-destructive'}>
                        {log.status}
                      </span>
                    </TableCell>
                    <TableCell>{log.execution_time_ms}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No recent logs found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Stat card component
const StatCard = ({ 
  title, 
  value, 
  trend = null, 
  description 
}: { 
  title: string; 
  value: string | null; 
  trend?: number | null; 
  description: string;
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value === null ? <Skeleton className="h-8 w-20" /> : value}
        </div>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          {description}
          {trend !== null && (
            <span className="ml-1">
              {trend > 0 ? (
                <span className="text-success-DEFAULT">↑ {trend.toFixed(1)}%</span>
              ) : trend < 0 ? (
                <span className="text-destructive">↓ {Math.abs(trend).toFixed(1)}%</span>
              ) : (
                <span className="text-muted-foreground">0%</span>
              )}
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  );
};

export default Analytics;
