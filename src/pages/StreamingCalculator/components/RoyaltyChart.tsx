
import React from "react";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface RoyaltyChartProps {
  count: number;
  calculationType: "streams" | "monthlyListeners";
}

const PLATFORM_RATES = {
  Spotify: 0.00387,
  "Apple Music": 0.00800,
  Tidal: 0.01284,
  "Amazon Music": 0.00402,
  "YouTube Music": 0.00220,
  Deezer: 0.00400
};

const AVERAGE_STREAMS_PER_LISTENER = 3;

export const RoyaltyChart = ({ count, calculationType }: RoyaltyChartProps) => {
  const calculateEarnings = (rate: number, count: number) => {
    if (calculationType === "monthlyListeners") {
      return rate * count * AVERAGE_STREAMS_PER_LISTENER;
    }
    return rate * count;
  };
  
  const data = Object.entries(PLATFORM_RATES).map(([platform, rate]) => ({
    platform,
    earnings: calculateEarnings(rate, count)
  }));

  return (
    <Card className="p-6 backdrop-blur-sm bg-white/80">
      <h3 className="text-xl font-semibold mb-6">
        {calculationType === "streams" ? "Earnings Comparison" : "Monthly Earnings Comparison"}
      </h3>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E6E6E6" opacity={0.4} />
            <XAxis 
              dataKey="platform" 
              tick={{ fill: '#666666', fontSize: 12 }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: '#666666', fontSize: 12 }}
              tickLine={false}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                background: 'white',
                border: '1px solid #E6E6E6',
                borderRadius: '8px',
                padding: '12px'
              }}
              formatter={(value: number) => [
                `$${value.toFixed(2)}${calculationType === "monthlyListeners" ? "/month" : ""}`,
                'Earnings'
              ]}
            />
            <Bar 
              dataKey="earnings" 
              fill="#6851FB" 
              radius={[4, 4, 0, 0]}
              maxBarSize={60}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
