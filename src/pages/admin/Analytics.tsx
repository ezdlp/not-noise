
import { useQuery } from "@tanstack/react-query";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { TimeRangeSelect, TimeRangeValue } from "@/components/analytics/TimeRangeSelect";
import { StatCard } from "@/components/analytics/StatCard";
import { Card } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useState } from "react";

interface AnalyticsStats {
  day: string;
  total_views: number;
  unique_visitors: number;
  registered_users: number;
  pro_users: number;
  returning_visitors: number;
  active_users: number;
  feature_usage: Record<string, number>;
}

interface MAUStats {
  month: string;
  active_users: number;
  pro_users: number;
  total_users: number;
}

function Analytics() {
  const [timeRange, setTimeRange] = useState<TimeRangeValue>('28d');

  const getStartDate = () => {
    switch (timeRange) {
      case 'today':
        return startOfDay(new Date());
      case '7d':
        return subDays(new Date(), 7);
      case '28d':
        return subDays(new Date(), 28);
      case 'all':
        return new Date('2024-02-14');
      default:
        return subDays(new Date(), 28);
    }
  };

  const { data: currentStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["analytics", timeRange],
    queryFn: async () => {
      const startDate = getStartDate().toISOString();
      const endDate = endOfDay(new Date()).toISOString();

      const { data, error } = await supabase.rpc(
        'get_detailed_analytics_stats',
        {
          p_start_date: startDate,
          p_end_date: endDate
        }
      );

      if (error) throw error;
      return data as AnalyticsStats[];
    },
  });

  const { data: mauStats, isLoading: isMauLoading } = useQuery({
    queryKey: ["mau"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_mau');
      if (error) throw error;
      return data as MAUStats[];
    },
  });

  const getPreviousPeriodStats = () => {
    if (!currentStats?.length) return null;
    
    const currentPeriod = currentStats.reduce((acc, stat) => ({
      total_views: acc.total_views + stat.total_views,
      unique_visitors: acc.unique_visitors + stat.unique_visitors,
      registered_users: acc.registered_users + stat.registered_users,
      pro_users: acc.pro_users + stat.pro_users,
      returning_visitors: acc.returning_visitors + stat.returning_visitors,
      active_users: acc.active_users + stat.active_users
    }), {
      total_views: 0,
      unique_visitors: 0,
      registered_users: 0,
      pro_users: 0,
      returning_visitors: 0,
      active_users: 0
    });

    return currentPeriod;
  };

  const previousStats = getPreviousPeriodStats();
  const latestStats = currentStats?.[currentStats.length - 1];

  if (isStatsLoading || isMauLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <div className="animate-pulse bg-neutral-200 h-8 w-[180px] rounded" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 space-y-2">
              <div className="h-20 animate-pulse bg-neutral-200 rounded" />
            </Card>
          ))}
        </div>
        <Card className="p-4">
          <div className="h-[400px] animate-pulse bg-neutral-200 rounded" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 border-b border-neutral-200">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <TimeRangeSelect value={timeRange} onChange={setTimeRange} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Views"
          value={previousStats?.total_views || 0}
          previousValue={0}
          description="Excluding smart link pages"
        />
        <StatCard
          title="Unique Visitors"
          value={previousStats?.unique_visitors || 0}
          previousValue={0}
          description="Based on session IDs"
        />
        <StatCard
          title="Registered Users"
          value={previousStats?.registered_users || 0}
          previousValue={0}
        />
        <StatCard
          title="Pro Users"
          value={previousStats?.pro_users || 0}
          previousValue={0}
        />
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Trends</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={currentStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="day"
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="total_views"
                stackId="1"
                stroke="#6851FB"
                fill="#6851FB"
                fillOpacity={0.1}
                name="Total Views"
              />
              <Area
                type="monotone"
                dataKey="unique_visitors"
                stackId="2"
                stroke="#37D299"
                fill="#37D299"
                fillOpacity={0.1}
                name="Unique Visitors"
              />
              <Area
                type="monotone"
                dataKey="registered_users"
                stackId="3"
                stroke="#FE28A2"
                fill="#FE28A2"
                fillOpacity={0.1}
                name="Registered Users"
              />
              <Area
                type="monotone"
                dataKey="pro_users"
                stackId="4"
                stroke="#F97316"
                fill="#F97316"
                fillOpacity={0.1}
                name="Pro Users"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Monthly Active Users (MAU)</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mauStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="month"
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="active_users"
                stackId="1"
                stroke="#6851FB"
                fill="#6851FB"
                fillOpacity={0.1}
                name="Active Users"
              />
              <Area
                type="monotone"
                dataKey="pro_users"
                stackId="2"
                stroke="#37D299"
                fill="#37D299"
                fillOpacity={0.1}
                name="Pro Users"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

export default Analytics;
