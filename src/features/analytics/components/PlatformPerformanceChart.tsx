
import React from "react";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { TimeRangeSelect, TimeRangeValue } from "@/components/analytics/TimeRangeSelect";

interface PlatformData {
  name: string;
  clicks: number;
}

interface PlatformPerformanceChartProps {
  data: PlatformData[];
  timeRange: TimeRangeValue;
  onTimeRangeChange: (value: TimeRangeValue) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-neutral-border bg-white p-4 shadow-md animate-fade-in">
        <p className="mb-2 text-sm font-medium text-[#111827] font-poppins">{label}</p>
        <div className="text-sm font-dm-sans">
          <span className="font-medium text-primary">
            Clicks:
          </span>{" "}
          <span className="text-[#6B7280]">{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

export function PlatformPerformanceChart({ 
  data, 
  timeRange, 
  onTimeRangeChange 
}: PlatformPerformanceChartProps) {
  return (
    <Card className="p-6 transition-all duration-300 hover:shadow-md border border-neutral-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#111827] font-poppins">Platform Performance</h2>
        <TimeRangeSelect value={timeRange} onChange={onTimeRangeChange} />
      </div>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6851FB" stopOpacity={1}/>
                <stop offset="100%" stopColor="#4A47A5" stopOpacity={1}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#E6E6E6"
              opacity={0.4}
              vertical={false}
            />
            <XAxis 
              dataKey="name" 
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
            <Bar 
              dataKey="clicks" 
              fill="url(#barGradient)"
              radius={[4, 4, 0, 0]}
              className="transition-all duration-300"
            >
              <LabelList 
                dataKey="clicks" 
                position="top" 
                fill="#374151"
                fontSize={11}
                className="font-dm-sans"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
