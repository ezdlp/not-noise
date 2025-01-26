import { useQuery } from "@tanstack/react-query";
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
import { Card } from "@/components/ui/card";
import { format, subDays } from "date-fns";

interface DailyStatsProps {
  smartLinkId: string;
}

interface DailyStats {
  day: string;
  views: number;
  clicks: number;
}

export function DailyStatsChart({ smartLinkId }: DailyStatsProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dailyStats", smartLinkId],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      const { data, error } = await supabase.rpc("get_daily_stats", {
        p_smart_link_id: smartLinkId,
        p_start_date: thirtyDaysAgo,
      });

      if (error) throw error;

      return data.map((stat: DailyStats) => ({
        ...stat,
        day: format(new Date(stat.day), "MMM d"),
      }));
    },
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="h-[400px] animate-pulse bg-gray-100 rounded" />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Daily Performance</h2>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={stats}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="views"
              stackId="1"
              stroke="#8884d8"
              fill="#8884d8"
              name="Views"
            />
            <Area
              type="monotone"
              dataKey="clicks"
              stackId="2"
              stroke="#82ca9d"
              fill="#82ca9d"
              name="Clicks"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}