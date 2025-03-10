
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TrendChartProps {
  trendData: { date: string; avgScore: number }[];
}

export function TrendsChart({ trendData }: TrendChartProps) {
  return (
    <div className="space-y-4">
      <div className="h-72 w-full">
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData}
              margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }} 
                angle={-45}
                textAnchor="end"
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fontSize: 12 }}
                label={{ value: 'Popularity Score', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
              />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="avgScore" 
                name="Avg. Popularity"
                stroke="#6851FB" 
                strokeWidth={2}
                dot={{ r: 1 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">No trend data available yet</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-sm text-muted-foreground">
        <p>The chart shows the average daily Spotify popularity score for all tracked Pro user tracks.</p>
      </div>
    </div>
  );
}
