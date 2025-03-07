
import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TimeRangeSelect, TimeRangeValue } from '@/components/analytics/TimeRangeSelect';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { format } from 'date-fns';
import { analyticsService } from '@/services/analyticsService';

interface PopularityDataPoint {
  measured_at: string;
  popularity_score: number;
}

interface SpotifyPopularityChartProps {
  data: PopularityDataPoint[];
  timeRange: TimeRangeValue;
  onTimeRangeChange: (value: TimeRangeValue) => void;
  isLoading: boolean;
  smartLinkId: string;
}

export function SpotifyPopularityChart({
  data,
  timeRange,
  onTimeRangeChange,
  isLoading,
  smartLinkId
}: SpotifyPopularityChartProps) {
  // Format data for the chart
  const chartData = data.map(point => ({
    date: format(new Date(point.measured_at), 'MMM dd'),
    score: point.popularity_score,
    timestamp: new Date(point.measured_at).getTime(),
    fullDate: format(new Date(point.measured_at), 'MMM dd, yyyy'),
  })).sort((a, b) => a.timestamp - b.timestamp);

  // Calculate average for reference line
  const avgScore = chartData.length > 0
    ? Math.round(chartData.reduce((sum, item) => sum + item.score, 0) / chartData.length)
    : 0;

  // Track feature usage
  useEffect(() => {
    if (smartLinkId && !isLoading && data.length > 0) {
      analyticsService.trackSpotifyPopularityView(smartLinkId)
        .catch(err => console.error('Error tracking Spotify popularity view:', err));
    }
  }, [smartLinkId, isLoading, data.length]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-neutral-border bg-white p-4 shadow-md animate-fade-in">
          <p className="mb-2 text-sm font-medium text-[#111827] font-poppins">{payload[0].payload.fullDate}</p>
          <div className="text-sm font-dm-sans">
            <span className="font-medium text-primary">
              Popularity Score:
            </span>{" "}
            <span className="text-[#6B7280]">{payload[0].value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6 transition-all duration-300 hover:shadow-md border border-neutral-border">
      <div className="flex flex-col mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-[#111827] font-poppins">Spotify Popularity</h2>
          <TimeRangeSelect value={timeRange} onChange={onTimeRangeChange} />
        </div>
        <p className="text-xs text-[#6B7280] font-dm-sans leading-tight">
          The Spotify Popularity Score (0-100) reflects how well your song is performing relative to others on the platform. It updates every 3 days and is influenced by recent streams, saves, playlist adds, and listener engagement—higher scores increase your chances of being featured in algorithmic playlists like Discover Weekly and Release Radar.
        </p>
      </div>
      {isLoading ? (
        <div className="h-[400px] flex justify-center items-center">
          <Skeleton className="h-full w-full rounded-lg animate-pulse" />
        </div>
      ) : data.length > 0 ? (
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6851FB" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#6851FB" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#E6E6E6" 
                opacity={0.4} 
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                stroke="#374151" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
                tick={{ fill: '#374151' }}
                className="font-dm-sans"
              />
              <YAxis 
                domain={[0, 100]} 
                stroke="#374151" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                dx={-10}
                tick={{ fill: '#374151' }}
                className="font-dm-sans"
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={avgScore} 
                stroke="#4A47A5" 
                strokeDasharray="3 3" 
                className="text-xs font-dm-sans"
                label={{ 
                  value: `Avg: ${avgScore}`, 
                  position: 'insideBottomRight',
                  fill: '#4A47A5',
                  fontSize: 12,
                }}
              />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#6851FB" 
                fillOpacity={1} 
                fill="url(#colorScore)" 
                strokeWidth={2}
                activeDot={{ r: 6, stroke: '#6851FB', strokeWidth: 1, fill: '#ffffff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[200px] flex flex-col items-center justify-center text-center p-6">
          <p className="text-[#6B7280] font-dm-sans mb-2">No popularity data available yet</p>
          <p className="text-sm text-[#9CA3AF] font-dm-sans">
            Spotify popularity data is collected every 3 days. Check back soon to see your track's popularity trend.
          </p>
        </div>
      )}
    </Card>
  );
}
