import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
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
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{smartLink.title} Analytics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            Total Views
          </h3>
          <p className="text-2xl font-bold">{totalViews}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            Total Clicks
          </h3>
          <p className="text-2xl font-bold">{totalClicks}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">CTR</h3>
          <p className="text-2xl font-bold">{ctr.toFixed(1)}%</p>
        </Card>
      </div>

      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Platform Performance</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="clicks" fill="#6851FB" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Views</h2>
          <div className="space-y-4">
            {smartLink.link_views?.slice(0, 5).map((view) => (
              <div
                key={view.id}
                className="flex items-center justify-between border-b pb-2"
              >
                <div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(view.viewed_at).toLocaleString()}
                  </p>
                  <p className="text-sm">{view.country || "Unknown location"}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {view.user_agent}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Clicks</h2>
          <div className="space-y-4">
            {smartLink.platform_links?.flatMap((pl) =>
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
                  className="flex items-center justify-between border-b pb-2"
                >
                  <div>
                    <p className="text-sm font-medium">{click.platform_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(click.clicked_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-sm">
                    {click.country || "Unknown location"}
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}