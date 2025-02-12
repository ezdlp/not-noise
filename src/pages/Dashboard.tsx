
import { useQuery } from "@tanstack/react-query";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { SmartLinksList } from "@/components/dashboard/SmartLinksList";
import { EmailSubscribersList } from "@/components/dashboard/EmailSubscribersList";
import { SubscriptionBanner } from "@/components/subscription/SubscriptionBanner";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link2, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, subscription_features!inner(*)")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

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

  const handleCreateClick = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    try {
      const { data: canCreate, error } = await supabase
        .rpc('check_smart_link_limit', { user_id: user.user.id });

      if (error) throw error;

      if (!canCreate) {
        setShowUpgradeModal(true);
        return;
      }

      navigate("/create");
    } catch (error) {
      console.error("Error checking smart link limit:", error);
      toast.error("Failed to check link limit");
    }
  };

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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Overview</h2>
              <Button
                onClick={handleCreateClick}
                className="gap-2"
              >
                <Link2 className="h-4 w-4" />
                Create Smart Link
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DashboardStats data={links} />
            </div>
          </div>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="smart-links" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="smart-links">Smart Links</TabsTrigger>
            <TabsTrigger value="email-subscribers">Email Subscribers</TabsTrigger>
          </TabsList>
          <TabsContent value="smart-links" className="mt-6">
            <SmartLinksList links={links} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="email-subscribers" className="mt-6">
            <EmailSubscribersList />
          </TabsContent>
        </Tabs>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="create more smart links"
        description="You've reached the limit of smart links on the free plan. Upgrade to Pro for unlimited smart links and more features!"
      />
    </div>
  );
}
