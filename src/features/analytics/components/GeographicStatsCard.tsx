
import React from "react";
import { Card } from "@/components/ui/card";
import { GeoStatsTable } from "@/components/analytics/GeoStatsTable";
import { TimeRangeSelect, TimeRangeValue } from "@/components/analytics/TimeRangeSelect";
import { GeoStat } from "@/models/smartLinkAnalytics";

interface GeographicStatsCardProps {
  geoStats: GeoStat[] | undefined;
  timeRange: TimeRangeValue;
  onTimeRangeChange: (value: TimeRangeValue) => void;
}

export function GeographicStatsCard({
  geoStats,
  timeRange,
  onTimeRangeChange,
}: GeographicStatsCardProps) {
  return (
    <Card className="p-6 transition-all duration-300 hover:shadow-md border border-neutral-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#111827] font-poppins">Geographic Breakdown</h2>
        <TimeRangeSelect value={timeRange} onChange={onTimeRangeChange} />
      </div>
      <GeoStatsTable data={geoStats || []} />
    </Card>
  );
}
