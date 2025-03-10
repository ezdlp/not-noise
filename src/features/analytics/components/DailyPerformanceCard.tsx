
import React from "react";
import { Card } from "@/components/ui/card";
import { DailyStatsChart } from "@/components/dashboard/DailyStatsChart";
import { TimeRangeSelect, TimeRangeValue } from "@/components/analytics/TimeRangeSelect";

interface DailyPerformanceCardProps {
  smartLinkId: string;
  startDate: string;
  timeRange: TimeRangeValue;
  onTimeRangeChange: (value: TimeRangeValue) => void;
}

export function DailyPerformanceCard({
  smartLinkId,
  startDate,
  timeRange,
  onTimeRangeChange,
}: DailyPerformanceCardProps) {
  return (
    <Card className="p-6 transition-all duration-300 hover:shadow-md border border-neutral-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#111827] font-poppins">Daily Performance</h2>
        <TimeRangeSelect value={timeRange} onChange={onTimeRangeChange} />
      </div>
      {smartLinkId && <DailyStatsChart smartLinkId={smartLinkId} startDate={startDate} />}
    </Card>
  );
}
