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

interface AnalyticsStats {
  day: string;
  page_views: number;
  unique_visitors: number;
  registered_users: number;
  active_users: number;
}

function Analytics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data, error } = await supabase.rpc("get_analytics_stats", {
        p_start_date: thirtyDaysAgo,
      });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="h-20 animate-pulse bg-gray-100 rounded" />
            </Card>
          ))}
        </div>
        <Card className="p-4">
          <div className="h-[400px] animate-pulse bg-gray-100 rounded" />
        </Card>
      </div>
    );
  }

  const latestStats = stats?.[stats.length - 1] || {
    page_views: 0,
    unique_visitors: 0,
    registered_users: 0,
    active_users: 0,
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <h3 className="font-medium text-muted-foreground">Page Views</h3>
          <p className="text-2xl font-bold">{latestStats.page_views}</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-medium text-muted-foreground">Unique Visitors</h3>
          <p className="text-2xl font-bold">{latestStats.unique_visitors}</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-medium text-muted-foreground">Registered Users</h3>
          <p className="text-2xl font-bold">{latestStats.registered_users}</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-medium text-muted-foreground">Active Users</h3>
          <p className="text-2xl font-bold">{latestStats.active_users}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">30 Day Trends</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="page_views"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                name="Page Views"
              />
              <Area
                type="monotone"
                dataKey="unique_visitors"
                stackId="2"
                stroke="#82ca9d"
                fill="#82ca9d"
                name="Unique Visitors"
              />
              <Area
                type="monotone"
                dataKey="registered_users"
                stackId="3"
                stroke="#ffc658"
                fill="#ffc658"
                name="Registered Users"
              />
              <Area
                type="monotone"
                dataKey="active_users"
                stackId="4"
                stroke="#ff8042"
                fill="#ff8042"
                name="Active Users"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

export default Analytics;