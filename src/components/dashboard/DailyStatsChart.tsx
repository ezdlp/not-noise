
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
  Legend,
} from "recharts";
import { format, subDays } from "date-fns";

interface DailyStatsProps {
  smartLinkId: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-neutral-border bg-white p-3 shadow-sm">
        <p className="mb-1 text-sm font-medium text-neutral-night">{label}</p>
        {payload.map((pld: any, index: number) => (
          <div key={index} className="text-sm">
            <span className="font-medium" style={{ color: pld.color }}>
              {pld.name}:
            </span>{" "}
            <span className="text-muted-foreground">{pld.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

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

      return (data || []).map((stat) => ({
        ...stat,
        day: format(new Date(stat.day), "MMM d"),
      }));
    },
  });

  if (isLoading) {
    return (
      <div className="h-[300px] md:h-[400px] animate-pulse bg-neutral-seasalt rounded" />
    );
  }

  if (!stats) {
    return (
      <div className="h-[300px] md:h-[400px] flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 text-neutral-night">Daily Performance</h2>
      <div className="h-[300px] md:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={stats}
            margin={{
              top: 20,
              right: 5,
              left: -15,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6851FB" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6851FB" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#37D299" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#37D299" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#E6E6E6"
              opacity={0.5}
            />
            <XAxis 
              dataKey="day" 
              stroke="#666666"
              fontSize={12}
              tickLine={false}
              angle={-45}
              textAnchor="end"
              height={60}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#666666"
              fontSize={12}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              height={36}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="#6851FB"
              fill="url(#viewsGradient)"
              name="Views"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#6851FB" }}
            />
            <Area
              type="monotone"
              dataKey="clicks"
              stroke="#37D299"
              fill="url(#clicksGradient)"
              name="Clicks"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#37D299" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
