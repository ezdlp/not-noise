import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowUpIcon, ArrowDownIcon, EyeIcon, MousePointerClickIcon, TargetIcon, InfoIcon } from "lucide-react";
import { format } from "date-fns";

export function DashboardStats({ data }: { data: any[] }) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Calculate current period metrics (last 7 days)
  const currentPeriodViews = data?.reduce((acc, link) => {
    return acc + (link.link_views?.filter((view: any) => 
      new Date(view.viewed_at) >= sevenDaysAgo
    ).length || 0);
  }, 0) || 0;

  const currentPeriodClicks = data?.reduce((acc, link) => {
    const platformClicks = link.platform_links?.reduce((sum: number, pl: any) => {
      return sum + (pl.platform_clicks?.filter((click: any) =>
        new Date(click.clicked_at) >= sevenDaysAgo
      ).length || 0);
    }, 0) || 0;
    return acc + platformClicks;
  }, 0) || 0;

  // Calculate previous period metrics (7-14 days ago)
  const previousPeriodViews = data?.reduce((acc, link) => {
    return acc + (link.link_views?.filter((view: any) => 
      new Date(view.viewed_at) >= fourteenDaysAgo && new Date(view.viewed_at) < sevenDaysAgo
    ).length || 0);
  }, 0) || 0;

  const previousPeriodClicks = data?.reduce((acc, link) => {
    const platformClicks = link.platform_links?.reduce((sum: number, pl: any) => {
      return sum + (pl.platform_clicks?.filter((click: any) =>
        new Date(click.clicked_at) >= fourteenDaysAgo && new Date(click.clicked_at) < sevenDaysAgo
      ).length || 0);
    }, 0) || 0;
    return acc + platformClicks;
  }, 0) || 0;

  // Calculate total metrics (all time)
  const totalViews = data?.reduce((acc, link) => acc + (link.link_views?.length || 0), 0) || 0;
  const totalClicks = data?.reduce((acc, link) => {
    const platformClicks = link.platform_links?.reduce((sum: number, pl: any) => {
      return sum + (pl.platform_clicks?.length || 0);
    }, 0) || 0;
    return acc + platformClicks;
  }, 0) || 0;

  // Calculate trends
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const viewsTrend = calculateTrend(currentPeriodViews, previousPeriodViews);
  const clicksTrend = calculateTrend(currentPeriodClicks, previousPeriodClicks);
  
  const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
  const currentCTR = currentPeriodViews > 0 ? (currentPeriodClicks / currentPeriodViews) * 100 : 0;
  const previousCTR = previousPeriodViews > 0 ? (previousPeriodClicks / previousPeriodViews) * 100 : 0;
  const ctrTrend = calculateTrend(currentCTR, previousCTR);

  const stats = [
    {
      name: "Total Views",
      value: totalViews,
      icon: EyeIcon,
      color: "bg-[#ECE9FF]",
      iconColor: "text-[#6851FB]",
      trend: viewsTrend,
      period: `${format(sevenDaysAgo, 'MMM d')} - ${format(now, 'MMM d')}`,
      currentPeriod: currentPeriodViews,
      previousPeriod: previousPeriodViews
    },
    {
      name: "Total Clicks",
      value: totalClicks,
      icon: MousePointerClickIcon,
      color: "bg-[#E6F9F2]",
      iconColor: "text-[#37D299]",
      trend: clicksTrend,
      period: `${format(sevenDaysAgo, 'MMM d')} - ${format(now, 'MMM d')}`,
      currentPeriod: currentPeriodClicks,
      previousPeriod: previousPeriodClicks
    },
    {
      name: "CTR",
      value: `${ctr.toFixed(1)}%`,
      icon: TargetIcon,
      color: "bg-[#FFF5FA]",
      iconColor: "text-[#FE28A2]",
      trend: ctrTrend,
      period: `${format(sevenDaysAgo, 'MMM d')} - ${format(now, 'MMM d')}`,
      currentPeriod: `${currentCTR.toFixed(1)}%`,
      previousPeriod: `${previousCTR.toFixed(1)}%`
    },
  ];

  return (
    <>
      {stats.map((stat) => (
        <Card 
          key={stat.name} 
          className="relative overflow-hidden transition-all hover:shadow-md hover:scale-[1.02] p-4"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${stat.color}`}>
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </p>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold">{stat.value}</h3>
                <div className="flex items-center gap-1">
                  {stat.trend !== 0 && (
                    <span className={`flex items-center text-sm ${stat.trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {stat.trend > 0 ? (
                        <ArrowUpIcon className="w-4 h-4" />
                      ) : (
                        <ArrowDownIcon className="w-4 h-4" />
                      )}
                      {Math.abs(stat.trend).toFixed(1)}%
                    </span>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="p-3">
                        <div className="space-y-1 text-sm">
                          <p className="font-medium">
                            {stat.trend > 0 ? 'Increase' : 'Decrease'} compared to previous 7 days
                          </p>
                          <p className="text-muted-foreground">
                            Current period: {stat.period}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </>
  );
}
