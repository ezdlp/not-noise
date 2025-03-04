
import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { TimeRangeSelect, TimeRangeValue } from '@/components/analytics/TimeRangeSelect';
import { Music, Info } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface PopularityDataPoint {
  measured_at: string;
  popularity_score: number;
}

interface SpotifyPopularityChartProps {
  data: PopularityDataPoint[];
  timeRange: TimeRangeValue;
  onTimeRangeChange: (value: TimeRangeValue) => void;
  isLoading: boolean;
}

export function SpotifyPopularityChart({
  data,
  timeRange,
  onTimeRangeChange,
  isLoading
}: SpotifyPopularityChartProps) {
  
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-neutral-border bg-white p-4 shadow-md animate-fade-in">
          <p className="mb-2 text-sm font-medium text-[#111827] font-poppins">
            {label ? format(new Date(label), 'MMM d, yyyy') : ''}
          </p>
          <div className="text-sm font-dm-sans">
            <span className="font-medium text-primary">
              Popularity:
            </span>{" "}
            <span className="text-[#6B7280]">{payload[0].value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const formattedData = useMemo(() => {
    return data.map(item => ({
      date: item.measured_at,
      popularity: item.popularity_score
    }));
  }, [data]);

  return (
    <Card className="p-6 transition-all duration-300 hover:shadow-md border border-neutral-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-[#111827] font-poppins">Spotify Popularity Trend</h2>
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <Info size={16} className="text-[#6B7280] hover:text-primary transition-colors cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent className="max-w-md p-4">
                <p className="text-sm font-dm-sans">
                  Spotify assigns each song a Popularity Score (0-100) based on its recent streams, 
                  saves, and engagement. A higher score increases your chances of being included 
                  in algorithmic playlists like Discover Weekly, Release Radar, and Radio. 
                  Tracking this trend helps you measure your song's momentum over time.
                </p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
        <TimeRangeSelect value={timeRange} onChange={onTimeRangeChange} />
      </div>
      
      {isLoading ? (
        <div className="h-[300px] w-full">
          <Skeleton className="h-full w-full" />
        </div>
      ) : formattedData.length === 0 ? (
        <div className="h-[300px] flex flex-col items-center justify-center text-center p-4">
          <Music size={48} className="text-muted-foreground mb-4 opacity-40" />
          <h3 className="text-lg font-medium text-[#111827] mb-2">No popularity data yet</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            We'll start tracking your song's popularity soon. Check back in a few days to see your trend.
          </p>
        </div>
      ) : (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={formattedData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="popularityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6851FB" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#6851FB" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => format(new Date(date), 'MMM d')}
                tick={{ fill: '#374151', fontSize: 12 }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
                dy={10}
                className="font-dm-sans"
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fill: '#374151', fontSize: 12 }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
                dx={-10}
                className="font-dm-sans"
              />
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#E6E6E6"
                opacity={0.4}
                vertical={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="popularity" 
                stroke="#6851FB" 
                fillOpacity={1} 
                fill="url(#popularityGradient)" 
                strokeWidth={2}
                activeDot={{ r: 6, fill: '#6851FB', stroke: 'white', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
