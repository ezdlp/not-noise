import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowUpIcon, ArrowDownIcon, EyeIcon, MousePointerClickIcon, TargetIcon } from "lucide-react";

export function DashboardStats({ data }: { data: any[] }) {
  const totalViews = data?.reduce((acc, link) => acc + (link.link_views?.length || 0), 0) || 0;
  
  // Fixed calculation for total clicks by properly accessing nested platform_links and their clicks
  const totalClicks = data?.reduce((acc, link) => {
    const platformClicks = link.platform_links?.reduce((sum: number, pl: any) => {
      return sum + (pl.clicks?.length || 0);
    }, 0) || 0;
    return acc + platformClicks;
  }, 0) || 0;

  const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

  const stats = [
    {
      name: "Total Views",
      value: totalViews,
      description: "Total number of smart link views",
      icon: EyeIcon,
      color: "bg-blue-50",
      iconColor: "text-blue-500",
      trend: 0,
    },
    {
      name: "Total Clicks",
      value: totalClicks,
      description: "Total number of platform clicks",
      icon: MousePointerClickIcon,
      color: "bg-purple-50",
      iconColor: "text-purple-500",
      trend: 0,
    },
    {
      name: "CTR",
      value: `${ctr.toFixed(1)}%`,
      description: "Click-through rate",
      icon: TargetIcon,
      color: "bg-green-50",
      iconColor: "text-green-500",
      trend: 0,
    },
  ];

  return (
    <>
      {stats.map((stat) => (
        <Card key={stat.name} className="relative overflow-hidden">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-4 cursor-help">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${stat.color}`}>
                      <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-bold">{stat.value}</h3>
                        {stat.trend !== 0 && (
                          <span className={`flex items-center text-sm ${stat.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
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
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{stat.description}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Compared to last 7 days
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Card>
      ))}
    </>
  );
}