
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DailyStatsChart } from "@/components/dashboard/DailyStatsChart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-neutral-border bg-white p-3 shadow-sm">
        <p className="mb-1 text-sm font-medium text-neutral-night">{label}</p>
        <div className="text-sm">
          <span className="font-medium text-primary">
            Clicks:
          </span>{" "}
          <span className="text-muted-foreground">{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function SmartLinkAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: smartLink, isLoading } = useQuery({
    queryKey: ["smartLink", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("smart_links")
        .select(`
          *,
          platform_links (
            id,
            platform_id,
            platform_name,
            url,
            clicks:platform_clicks (
              id,
              clicked_at,
              country,
              user_agent
            )
          ),
          link_views (
            id,
            viewed_at,
            country,
            user_agent
          ),
          email_subscribers (
            id,
            email,
            subscribed_at
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-seasalt rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="h-32 bg-neutral-seasalt"></Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!smartLink) return null;

  const totalViews = smartLink.link_views?.length || 0;
  const totalClicks = smartLink.platform_links?.reduce(
    (acc, pl) => acc + (pl.clicks?.length || 0),
    0
  ) || 0;
  const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

  const platformData = smartLink.platform_links?.map((pl) => ({
    name: pl.platform_name,
    clicks: pl.clicks?.length || 0,
  })) || [];

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/dashboard")}
          className="hover:bg-neutral-seasalt"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-neutral-night">{smartLink.title} Analytics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Views</h3>
          <p className="text-2xl font-semibold text-neutral-night">{totalViews}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Clicks</h3>
          <p className="text-2xl font-semibold text-neutral-night">{totalClicks}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">CTR</h3>
          <p className="text-2xl font-semibold text-neutral-night">{ctr.toFixed(1)}%</p>
        </Card>
      </div>

      {id && <DailyStatsChart smartLinkId={id} />}

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 text-neutral-night">Platform Performance</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformData}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#E6E6E6"
                opacity={0.4}
              />
              <XAxis 
                dataKey="name" 
                stroke="#666666"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#666666"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="clicks" 
                fill="#6851FB"
                fillOpacity={0.85}
                radius={[2, 2, 0, 0]}
                className="transition-all duration-200 ease-out"
                onMouseOver={(data: any, index: number) => {
                  document.querySelectorAll('.recharts-bar-rectangle').forEach((rect: Element) => {
                    if (rect instanceof SVGElement) {
                      rect.style.fill = '#4A47A5';
                      rect.style.filter = 'drop-shadow(0 2px 4px rgba(104, 81, 251, 0.1))';
                      rect.style.transform = 'scale(1.01)';
                    }
                  });
                }}
                onMouseOut={(data: any, index: number) => {
                  document.querySelectorAll('.recharts-bar-rectangle').forEach((rect: Element) => {
                    if (rect instanceof SVGElement) {
                      rect.style.fill = '#6851FB';
                      rect.style.filter = 'none';
                      rect.style.transform = 'scale(1)';
                    }
                  });
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 text-neutral-night">Recent Clicks</h2>
        <div className="space-y-4">
          {smartLink.platform_links
            ?.flatMap((pl) =>
              (pl.clicks || []).map((click) => ({
                ...click,
                platform_name: pl.platform_name,
              }))
            )
            .sort(
              (a, b) =>
                new Date(b.clicked_at).getTime() -
                new Date(a.clicked_at).getTime()
            )
            .slice(0, 5)
            .map((click) => (
              <div
                key={click.id}
                className="flex items-center justify-between border-b border-neutral-border pb-2"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-night">{click.platform_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(click.clicked_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-sm text-neutral-night">
                  {click.country || "Unknown location"}
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}

