
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
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface DailyStatsProps {
  smartLinkId: string;
  startDate: string;
}

interface DailyStats {
  day: string;
  views: number;
  clicks: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-neutral-border bg-white p-4 shadow-md animate-fade-in">
        <p className="mb-2 text-sm font-medium text-[#111827] font-poppins">{label}</p>
        {payload.map((pld: any, index: number) => (
          <div key={index} className="text-sm font-dm-sans">
            <span className="font-medium" style={{ color: pld.color }}>
              {pld.name}:
            </span>{" "}
            <span className="text-[#6B7280]">{pld.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function DailyStatsChart({ smartLinkId, startDate }: DailyStatsProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dailyStats", smartLinkId, startDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_daily_stats", {
        p_smart_link_id: smartLinkId,
        p_start_date: startDate,
      });

      if (error) throw error;

      return (data || []).map((stat) => ({
        ...stat,
        day: format(new Date(stat.day), "MMM d"),
      }));
    },
  });

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full animate-pulse" />;
  }

  if (!stats) {
    return (
      <div className="h-[400px] flex items-center justify-center text-[#6B7280] font-dm-sans">
        No data available
      </div>
    );
  }

  return (
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
          <defs>
            <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6851FB" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#6851FB" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#37D299" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#37D299" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#E6E6E6"
            opacity={0.4}
            vertical={false}
          />
          <XAxis 
            dataKey="day" 
            stroke="#374151"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            dy={10}
            tick={{ fill: '#374151' }}
            className="font-dm-sans"
          />
          <YAxis 
            stroke="#374151"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            dx={-10}
            tick={{ fill: '#374151' }}
            className="font-dm-sans"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            height={36}
            iconType="circle"
            className="font-dm-sans"
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
  );
}
