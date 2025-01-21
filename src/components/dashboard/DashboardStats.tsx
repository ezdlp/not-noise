import { Card } from "@/components/ui/card";
import { ChartBarIcon, UsersIcon, MousePointerClickIcon, PercentIcon, ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow, subDays } from "date-fns";

interface DashboardStatsProps {
  data?: any[];
}

export function DashboardStats({ data = [] }: DashboardStatsProps) {
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  
  // Calculate current period metrics
  const totalViews = data?.reduce((acc, link) => acc + (link.link_views?.length || 0), 0) || 0;
  const totalClicks = data?.reduce((acc, link) => acc + (link.platform_clicks?.length || 0), 0) || 0;
  const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0";

  // Calculate previous period metrics
  const previousViews = data?.reduce((acc, link) => {
    const oldViews = link.link_views?.filter((view: any) => 
      new Date(view.viewed_at) < sevenDaysAgo
    ).length || 0;
    return acc + oldViews;
  }, 0);

  const previousClicks = data?.reduce((acc, link) => {
    const oldClicks = link.platform_clicks?.filter((click: any) => 
      new Date(click.clicked_at) < sevenDaysAgo
    ).length || 0;
    return acc + oldClicks;
  }, 0);

  const previousCtr = previousViews > 0 ? ((previousClicks / previousViews) * 100).toFixed(1) : "0";

  // Calculate trends
  const viewsTrend = ((totalViews - previousViews) / (previousViews || 1)) * 100;
  const clicksTrend = ((totalClicks - previousClicks) / (previousClicks || 1)) * 100;
  const ctrTrend = parseFloat(ctr) - parseFloat(previousCtr);

  const stats = [
    {
      name: "Total Views",
      value: totalViews,
      trend: viewsTrend,
      icon: UsersIcon,
      description: "Total number of smart link views",
      color: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      name: "Total Clicks",
      value: totalClicks,
      trend: clicksTrend,
      icon: MousePointerClickIcon,
      description: "Total number of platform clicks",
      color: "bg-secondary/10",
      iconColor: "text-secondary",
    },
    {
      name: "CTR",
      value: `${ctr}%`,
      trend: ctrTrend,
      icon: PercentIcon,
      description: "Click-through rate (Clicks/Views)",
      color: "bg-success/10",
      iconColor: "text-success",
    },
  ];

  return (
    <TooltipProvider>
      {stats.map((stat) => (
        <Card 
          key={stat.name} 
          className="p-6 transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 group"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-4 cursor-help">
                <div className={`p-3 rounded-lg ${stat.color} transition-colors duration-200 group-hover:bg-primary/20`}>
                  <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold font-heading">{stat.value}</h3>
                    {stat.trend !== 0 && (
                      <span className={`flex items-center text-sm ${stat.trend > 0 ? 'text-success' : 'text-red-500'}`}>
                        {stat.trend > 0 ? (
                          <ArrowUpIcon className="w-4 h-4" />
                        ) : (
                          <ArrowDownIcon className="w-4 h-4" />
                        )}
                        {Math.abs(stat.trend).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{stat.description}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Compared to last 7 days
              </p>
            </TooltipContent>
          </Tooltip>
        </Card>
      ))}
    </TooltipProvider>
  );
}