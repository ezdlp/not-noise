import { Card } from "@/components/ui/card";
import { ChartBarIcon, UsersIcon, MousePointerClickIcon, PercentIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DashboardStatsProps {
  data?: any[];
}

export function DashboardStats({ data = [] }: DashboardStatsProps) {
  const totalViews = data?.reduce((acc, link) => acc + (link.link_views?.length || 0), 0) || 0;
  const totalClicks = data?.reduce((acc, link) => acc + (link.platform_clicks?.length || 0), 0) || 0;
  const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0";

  const stats = [
    {
      name: "Total Views",
      value: totalViews,
      icon: UsersIcon,
      description: "Total number of smart link views",
      color: "bg-blue-500/10",
      iconColor: "text-blue-500",
    },
    {
      name: "Total Clicks",
      value: totalClicks,
      icon: MousePointerClickIcon,
      description: "Total number of platform clicks",
      color: "bg-green-500/10",
      iconColor: "text-green-500",
    },
    {
      name: "CTR",
      value: `${ctr}%`,
      icon: PercentIcon,
      description: "Click-through rate (Clicks/Views)",
      color: "bg-purple-500/10",
      iconColor: "text-purple-500",
    },
  ];

  return (
    <TooltipProvider>
      {stats.map((stat) => (
        <Card key={stat.name} className="p-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-4 cursor-help">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.name}
                  </p>
                  <h3 className="text-2xl font-bold">{stat.value}</h3>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{stat.description}</p>
            </TooltipContent>
          </Tooltip>
        </Card>
      ))}
    </TooltipProvider>
  );
}