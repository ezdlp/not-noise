
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface PlatformClick {
  id: string;
  clicked_at: string;
  country: string | null;
  platform_name: string;
  platform_id: string;
}

interface RecentClicksListProps {
  clicks: PlatformClick[];
  startDate: string;
}

export function RecentClicksList({ clicks, startDate }: RecentClicksListProps) {
  // Filter clicks by date and sort by most recent
  const recentClicks = clicks
    .filter(click => new Date(click.clicked_at) >= new Date(startDate))
    .sort(
      (a, b) =>
        new Date(b.clicked_at).getTime() -
        new Date(a.clicked_at).getTime()
    )
    .slice(0, 5);

  return (
    <Card className="p-6 transition-all duration-300 hover:shadow-md border border-neutral-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#111827] font-poppins">Recent Clicks</h2>
        <Button variant="outline" size="sm">View all</Button>
      </div>
      <div className="space-y-4">
        {recentClicks.length === 0 ? (
          <div className="text-center py-8 text-[#6B7280] font-dm-sans">
            No recent clicks in this time period
          </div>
        ) : (
          recentClicks.map((click) => (
            <div
              key={click.id}
              className="flex items-center justify-between border-b border-neutral-border pb-4 hover:bg-neutral-seasalt/5 transition-all duration-200 -mx-2 px-2 rounded-lg"
            >
              <div>
                <div className="flex items-center gap-2">
                  <img 
                    src={`/lovable-uploads/${click.platform_id.toLowerCase()}.png`}
                    alt={click.platform_name}
                    className="w-4 h-4 object-contain"
                  />
                  <p className="text-sm font-medium text-[#111827] font-dm-sans">{click.platform_name}</p>
                </div>
                <p className="text-sm text-[#6B7280] font-dm-sans mt-1">
                  {formatDistanceToNow(new Date(click.clicked_at), { addSuffix: true })}
                </p>
              </div>
              <div className="text-sm text-[#374151] font-dm-sans">
                {click.country || "Unknown location"}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
