
import { useQuery } from "@tanstack/react-query";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { SmartLinksList } from "@/components/dashboard/SmartLinksList";
import { EmailSubscribersList } from "@/components/dashboard/EmailSubscribersList";
import { SubscriptionBanner } from "@/components/subscription/SubscriptionBanner";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link2, Lock } from "lucide-react";
import { useState } from "react";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { cn } from "@/lib/utils";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useSmartLinkCreation } from "@/hooks/useSmartLinkCreation";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'smart-links' | 'email-subscribers'>('smart-links');
  const { isFeatureEnabled } = useFeatureAccess();
  const { handleCreateClick, showUpgradeModal, setShowUpgradeModal } = useSmartLinkCreation();
  
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

  const handleTabClick = (tab: 'smart-links' | 'email-subscribers') => {
    if (tab === 'email-subscribers' && !isFeatureEnabled('email_capture')) {
      setShowUpgradeModal(true);
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Subscription Banner */}
      <div className="bg-background/50 rounded-lg border border-border/50 overflow-hidden">
        <SubscriptionBanner />
      </div>
      
      {/* Dashboard Overview Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
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

        {/* Integrated Navigation */}
        <div className="mt-8 border-b border-border/50">
          <div className="flex space-x-8">
            <button
              onClick={() => handleTabClick('smart-links')}
              className={cn(
                "pb-4 text-sm font-medium relative transition-colors hover:text-primary",
                activeTab === 'smart-links'
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              )}
            >
              Smart Links
            </button>
            <button
              onClick={() => handleTabClick('email-subscribers')}
              className={cn(
                "pb-4 text-sm font-medium relative transition-colors hover:text-primary group",
                activeTab === 'email-subscribers'
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              )}
            >
              <span className="flex items-center gap-1.5">
                Email Subscribers
                {!isFeatureEnabled('email_capture') && (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground/70 group-hover:text-primary/70 transition-colors" />
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[300px] animate-in fade-in-50 duration-200">
          {activeTab === 'smart-links' ? (
            <SmartLinksList links={links} isLoading={isLoading} />
          ) : (
            <EmailSubscribersList />
          )}
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={activeTab === 'email-subscribers' ? "collect email subscribers" : "create more smart links"}
        description={activeTab === 'email-subscribers' 
          ? "Upgrade to Pro to collect emails from your fans and build your mailing list!"
          : "You've reached the limit of smart links on the free plan. Upgrade to Pro for unlimited smart links and more features!"}
      />
    </div>
  );
}
