import { useQuery } from "@tanstack/react-query";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { SmartLinksList } from "@/components/dashboard/SmartLinksList";
import { SubscriptionBanner } from "@/components/subscription/SubscriptionBanner";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Dashboard() {
  const { data: links, isLoading } = useQuery({
    queryKey: ["smartLinks"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("smart_links")
        .select(`
          *,
          platform_links (
            id,
            platform_id,
            platform_name,
            url,
            platform_clicks (
              id,
              clicked_at
            )
          ),
          link_views (
            id,
            viewed_at
          )
        `)
        .eq('user_id', user.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load smart links");
        throw error;
      }

      return data;
    },
  });

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="grid grid-cols-1 gap-4">
        {/* Subscription Section */}
        <div className="bg-background/50 rounded-lg border border-border/50 overflow-hidden">
          <SubscriptionBanner />
        </div>
        
        {/* Dashboard Overview Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-4">
            <h2 className="text-2xl font-bold mb-4">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DashboardStats data={links} />
            </div>
          </div>
        </div>

        <SmartLinksList links={links} isLoading={isLoading} />
      </div>
    </div>
  );
}