import { Card } from "@/components/ui/card";
import { ChartBarIcon, UsersIcon, LinkIcon } from "lucide-react";

interface DashboardStatsProps {
  data?: any[];
}

export function DashboardStats({ data = [] }: DashboardStatsProps) {
  const totalViews = data?.reduce((acc, link) => acc + (link.link_views?.length || 0), 0) || 0;
  const totalLinks = data?.length || 0;
  const activeLinks = data?.filter(link => link.platform_links?.length > 0).length || 0;

  const stats = [
    {
      name: "Total Views",
      value: totalViews,
      icon: UsersIcon,
      description: "Total number of smart link views",
    },
    {
      name: "Smart Links",
      value: totalLinks,
      icon: LinkIcon,
      description: "Total number of smart links created",
    },
    {
      name: "Active Links",
      value: activeLinks,
      icon: ChartBarIcon,
      description: "Smart links with active platforms",
    },
  ];

  return (
    <>
      {stats.map((stat) => (
        <Card key={stat.name} className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <stat.icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </p>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {stat.description}
          </p>
        </Card>
      ))}
    </>
  );
}