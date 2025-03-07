
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays } from 'date-fns';

interface AnalyticsData {
  current: {
    product_visits: number;
    smart_link_visits: number;
    signups: number;
    active_users: number;
    pro_subscribers: number;
    revenue: number;
    social_cards_usage: number;
    meta_pixel_usage: number;
    email_capture_usage: number;
  };
  previous: {
    product_visits: number;
    smart_link_visits: number;
    signups: number;
    active_users: number;
    pro_subscribers: number;
    revenue: number;
    social_cards_usage: number;
    meta_pixel_usage: number;
    email_capture_usage: number;
  };
  trends: {
    product_visits: number;
    smart_link_visits: number;
    signups: number;
    active_users: number;
    pro_subscribers: number;
    revenue: number;
    signup_conversion: number;
    free_to_paid: number;
  };
  timeSeriesData: Array<{
    day: string;
    product_page_views: number;
    smart_link_views: number;
    registered_users: number;
    active_users: number;
    pro_subscribers: number;
    total_revenue: number;
    social_assets_created: number;
    meta_pixels_added: number;
    email_capture_enabled: number;
  }>;
  proFeatureUsage: {
    social_cards: number;
    meta_pixel: number;
    email_capture: number;
  };
  mauTrend: Array<{
    month: string;
    active_users: number;
    pro_users: number;
  }>;
}

const Analytics = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  
  // Calculate date ranges
  const getDateRange = () => {
    const endDate = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'week':
        startDate = subDays(endDate, 7);
        break;
      case 'month':
        startDate = subDays(endDate, 30);
        break;
      case 'quarter':
        startDate = subDays(endDate, 90);
        break;
    }
    
    return { startDate, endDate };
  };
  
  const { startDate, endDate } = getDateRange();
  
  // Fetch analytics dashboard stats
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics-data', timeRange],
    queryFn: async () => {
      try {
        console.log('Fetching analytics data...');
        
        // Fetch dashboard stats
        const { data: dashboardStats, error: statsError } = await supabase.rpc('get_analytics_dashboard_stats', {
          p_start_date: startDate.toISOString(),
          p_end_date: endDate.toISOString(),
          p_previous_period: true
        });
        
        if (statsError) {
          console.error('Error fetching dashboard stats:', statsError);
          throw statsError;
        }
        
        console.log('Dashboard stats:', dashboardStats);
        
        // Get current and previous period data
        const currentPeriod = dashboardStats.find(period => period.period === 'current');
        const previousPeriod = dashboardStats.find(period => period.period === 'previous');
        
        if (!currentPeriod || !previousPeriod) {
          throw new Error('Could not find current or previous period data');
        }
        
        // Get time series data
        const { data: timeSeriesData, error: timeSeriesError } = await supabase.rpc('get_improved_analytics_stats', {
          p_start_date: startDate.toISOString(),
          p_end_date: endDate.toISOString()
        });
        
        if (timeSeriesError) {
          console.error('Error fetching time series data:', timeSeriesError);
          throw timeSeriesError;
        }
        
        console.log('Time series data:', timeSeriesData);
        
        // Get MAU trend data
        const { data: mauTrend, error: mauError } = await supabase.rpc('get_monthly_active_users_trend', {
          p_months: timeRange === 'quarter' ? 6 : timeRange === 'month' ? 3 : 2
        });
        
        if (mauError) {
          console.error('Error fetching MAU trend:', mauError);
          throw mauError;
        }
        
        console.log('MAU trend:', mauTrend);
        
        // Get pro feature usage
        const { data: proFeatureUsage, error: featureUsageError } = await supabase.rpc('get_pro_feature_usage');
        
        if (featureUsageError) {
          console.error('Error fetching pro feature usage:', featureUsageError);
          throw featureUsageError;
        }
        
        console.log('Pro feature usage:', proFeatureUsage);
        
        // Calculate trends and conversion rates
        const calculateTrend = (current: number, previous: number) => {
          if (previous === 0) return current > 0 ? 100 : 0;
          return ((current - previous) / previous) * 100;
        };
        
        const signupConversionCurrent = currentPeriod.product_visits > 0 
          ? (currentPeriod.signups / currentPeriod.product_visits) * 100 
          : 0;
        
        const signupConversionPrevious = previousPeriod.product_visits > 0 
          ? (previousPeriod.signups / previousPeriod.product_visits) * 100 
          : 0;
        
        const freeToPaidCurrent = currentPeriod.signups > 0 
          ? (currentPeriod.pro_subscribers / currentPeriod.signups) * 100 
          : 0;
        
        const freeToPaidPrevious = previousPeriod.signups > 0 
          ? (previousPeriod.pro_subscribers / previousPeriod.signups) * 100 
          : 0;
        
        // Format the time series data for charts
        const formattedTimeSeriesData = timeSeriesData
          .filter(item => item.period === 'current')
          .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());
        
        // Create a structured analytics data object
        const result: AnalyticsData = {
          current: {
            product_visits: currentPeriod.product_visits || 0,
            smart_link_visits: currentPeriod.smart_link_visits || 0,
            signups: currentPeriod.signups || 0,
            active_users: currentPeriod.active_users || 0,
            pro_subscribers: currentPeriod.pro_subscribers || 0,
            revenue: currentPeriod.revenue || 0,
            social_cards_usage: currentPeriod.social_cards_usage || 0,
            meta_pixel_usage: currentPeriod.meta_pixel_usage || 0,
            email_capture_usage: currentPeriod.email_capture_usage || 0
          },
          previous: {
            product_visits: previousPeriod.product_visits || 0,
            smart_link_visits: previousPeriod.smart_link_visits || 0,
            signups: previousPeriod.signups || 0,
            active_users: previousPeriod.active_users || 0,
            pro_subscribers: previousPeriod.pro_subscribers || 0,
            revenue: previousPeriod.revenue || 0,
            social_cards_usage: previousPeriod.social_cards_usage || 0,
            meta_pixel_usage: previousPeriod.meta_pixel_usage || 0,
            email_capture_usage: previousPeriod.email_capture_usage || 0
          },
          trends: {
            product_visits: calculateTrend(currentPeriod.product_visits, previousPeriod.product_visits),
            smart_link_visits: calculateTrend(currentPeriod.smart_link_visits, previousPeriod.smart_link_visits),
            signups: calculateTrend(currentPeriod.signups, previousPeriod.signups),
            active_users: calculateTrend(currentPeriod.active_users, previousPeriod.active_users),
            pro_subscribers: calculateTrend(currentPeriod.pro_subscribers, previousPeriod.pro_subscribers),
            revenue: calculateTrend(currentPeriod.revenue, previousPeriod.revenue),
            signup_conversion: calculateTrend(signupConversionCurrent, signupConversionPrevious),
            free_to_paid: calculateTrend(freeToPaidCurrent, freeToPaidPrevious)
          },
          timeSeriesData: formattedTimeSeriesData,
          proFeatureUsage: {
            social_cards: proFeatureUsage.find(item => item.feature === "Social Assets")?.count || 0,
            meta_pixel: proFeatureUsage.find(item => item.feature === "Meta Pixels")?.count || 0,
            email_capture: proFeatureUsage.find(item => item.feature === "Email Capture")?.count || 0
          },
          mauTrend: mauTrend || []
        };
        
        return result;
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        throw error;
      }
    }
  });

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

  // Render trend indicator
  const renderTrendIndicator = (value: number, inverted: boolean = false) => {
    // For some metrics like conversion rate, a higher number is better
    // For other metrics like churn rate, a lower number is better (inverted)
    const isPositive = inverted ? value < 0 : value > 0;
    
    return (
      <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-success-DEFAULT' : 'text-destructive'}`}>
        {isPositive ? (
          <TrendingUp className="h-4 w-4" />
        ) : (
          <TrendingDown className="h-4 w-4" />
        )}
        <span>{Math.abs(value).toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <Tabs defaultValue={timeRange} onValueChange={(value) => setTimeRange(value as 'week' | 'month' | 'quarter')}>
          <TabsList className="bg-muted">
            <TabsTrigger value="week">7 Days</TabsTrigger>
            <TabsTrigger value="month">30 Days</TabsTrigger>
            <TabsTrigger value="quarter">90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Section 1: Traffic & User Acquisition Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Traffic & User Acquisition</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Product Visits"
            value={isLoading ? null : formatNumber(analyticsData?.current.product_visits || 0)}
            trend={isLoading ? null : analyticsData?.trends.product_visits}
            description={`Last ${timeRange === 'week' ? '7' : timeRange === 'month' ? '30' : '90'} days`}
          />
          <MetricCard
            title="Smart Link Visits"
            value={isLoading ? null : formatNumber(analyticsData?.current.smart_link_visits || 0)}
            trend={isLoading ? null : analyticsData?.trends.smart_link_visits}
            description={`Last ${timeRange === 'week' ? '7' : timeRange === 'month' ? '30' : '90'} days`}
          />
          <MetricCard
            title="Sign-Ups"
            value={isLoading ? null : formatNumber(analyticsData?.current.signups || 0)}
            trend={isLoading ? null : analyticsData?.trends.signups}
            description={`Last ${timeRange === 'week' ? '7' : timeRange === 'month' ? '30' : '90'} days`}
          />
          <MetricCard
            title="Sign-Up Conversion Rate"
            value={isLoading ? null : `${((analyticsData?.current.signups || 0) / (analyticsData?.current.product_visits || 1) * 100).toFixed(2)}%`}
            trend={isLoading ? null : analyticsData?.trends.signup_conversion}
            description="Product Visits to Sign-Ups"
          />
        </div>
      </div>

      {/* Section 2: Main Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Traffic Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Traffic Overview</CardTitle>
            <CardDescription>Product visits and smart link visits over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className="h-[300px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData?.timeSeriesData || []}>
                    <defs>
                      <linearGradient id="productVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6851FB" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#6851FB" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="smartLinkVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4A47A5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#4A47A5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                    <XAxis 
                      dataKey="day" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="product_page_views" 
                      name="Product Visits"
                      stroke="#6851FB" 
                      fillOpacity={1} 
                      fill="url(#productVisits)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="smart_link_views" 
                      name="Smart Link Visits"
                      stroke="#4A47A5" 
                      fillOpacity={1} 
                      fill="url(#smartLinkVisits)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartContainer>
          </CardContent>
        </Card>

        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>Sign-ups and active users over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className="h-[300px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData?.timeSeriesData || []}>
                    <defs>
                      <linearGradient id="signups" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#37D299" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#37D299" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="activeUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FE28A2" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#FE28A2" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                    <XAxis 
                      dataKey="day" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="registered_users" 
                      name="Sign-Ups"
                      stroke="#37D299" 
                      fillOpacity={1} 
                      fill="url(#signups)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="active_users" 
                      name="Active Users"
                      stroke="#FE28A2" 
                      fillOpacity={1} 
                      fill="url(#activeUsers)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Pro Feature Usage */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Pro Feature Usage</h2>
        <Card>
          <CardHeader>
            <CardTitle>Feature Adoption</CardTitle>
            <CardDescription>Usage of premium features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { 
                      name: 'Social Cards', 
                      count: analyticsData?.current.social_cards_usage || 0,
                      fill: '#6851FB'
                    },
                    { 
                      name: 'Meta Pixel', 
                      count: analyticsData?.current.meta_pixel_usage || 0,
                      fill: '#37D299' 
                    },
                    { 
                      name: 'Email Capture', 
                      count: analyticsData?.current.email_capture_usage || 0,
                      fill: '#FE28A2' 
                    }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.4} vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value} uses`, 'Usage Count']}
                      labelStyle={{ color: '#111827' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E6E6E6',
                        borderRadius: '6px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#6851FB" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="flex flex-col items-center p-4 border rounded-md">
                <div className="text-lg font-semibold text-[#6851FB]">
                  {isLoading ? <Skeleton className="h-6 w-16" /> : formatNumber(analyticsData?.current.social_cards_usage || 0)}
                </div>
                <div className="text-sm text-muted-foreground text-center">Social Cards Created</div>
              </div>
              <div className="flex flex-col items-center p-4 border rounded-md">
                <div className="text-lg font-semibold text-[#37D299]">
                  {isLoading ? <Skeleton className="h-6 w-16" /> : formatNumber(analyticsData?.current.meta_pixel_usage || 0)}
                </div>
                <div className="text-sm text-muted-foreground text-center">Meta Pixels Added</div>
              </div>
              <div className="flex flex-col items-center p-4 border rounded-md">
                <div className="text-lg font-semibold text-[#FE28A2]">
                  {isLoading ? <Skeleton className="h-6 w-16" /> : formatNumber(analyticsData?.current.email_capture_usage || 0)}
                </div>
                <div className="text-sm text-muted-foreground text-center">Email Captures Enabled</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 4: Business Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Business Metrics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="Monthly Active Users"
            value={isLoading ? null : formatNumber(analyticsData?.current.active_users || 0)}
            trend={isLoading ? null : analyticsData?.trends.active_users}
            description={`Last ${timeRange === 'week' ? '7' : timeRange === 'month' ? '30' : '90'} days`}
          />
          <MetricCard
            title="Revenue"
            value={isLoading ? null : formatCurrency(analyticsData?.current.revenue || 0)}
            trend={isLoading ? null : analyticsData?.trends.revenue}
            description={`Last ${timeRange === 'week' ? '7' : timeRange === 'month' ? '30' : '90'} days`}
          />
          <MetricCard
            title="Free to Paid Conversion"
            value={isLoading ? null : `${((analyticsData?.current.pro_subscribers || 0) / (analyticsData?.current.signups || 1) * 100).toFixed(2)}%`}
            trend={isLoading ? null : analyticsData?.trends.free_to_paid}
            description="Free users to Pro subscribers"
          />
        </div>
      </div>

      {/* MAU Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Active Users Trend</CardTitle>
          <CardDescription>Active users over recent months</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[300px]">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData?.mauTrend || []}>
                  <defs>
                    <linearGradient id="mauTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6851FB" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6851FB" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="mauPro" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#37D299" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#37D299" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="active_users" 
                    name="All Active Users"
                    stroke="#6851FB" 
                    fillOpacity={1} 
                    fill="url(#mauTotal)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pro_users" 
                    name="Pro Users"
                    stroke="#37D299" 
                    fillOpacity={1} 
                    fill="url(#mauPro)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

// MetricCard component for displaying individual metrics
const MetricCard = ({ 
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
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend !== null && (
            <span className="ml-1">
              {trend > 0 ? (
                <span className="text-success-DEFAULT flex items-center text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {trend.toFixed(1)}%
                </span>
              ) : trend < 0 ? (
                <span className="text-destructive flex items-center text-xs">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {Math.abs(trend).toFixed(1)}%
                </span>
              ) : (
                <span className="text-muted-foreground text-xs">0%</span>
              )}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Analytics;
