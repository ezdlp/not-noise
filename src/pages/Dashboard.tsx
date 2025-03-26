import { useQuery } from "@tanstack/react-query";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { SmartLinksList } from "@/components/dashboard/SmartLinksList";
import { EmailSubscribersList } from "@/components/dashboard/EmailSubscribersList";
import { SubscriptionBanner } from "@/components/subscription/SubscriptionBanner";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link2, Lock, HeadphonesIcon, Layout } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { cn } from "@/lib/utils";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useSmartLinkCreation } from "@/hooks/useSmartLinkCreation";
import { PromotionsDashboard } from "@/components/spotify-promotion/PromotionsDashboard";
import { useLocation, useNavigate, Link } from "react-router-dom";

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'smart-links' | 'email-subscribers' | 'promotions'>(
    (tabParam as any) || 'smart-links'
  );
  const [isTabLoading, setIsTabLoading] = useState(false);
  const { isFeatureEnabled } = useFeatureAccess();
  const { handleCreateClick, showUpgradeModal, setShowUpgradeModal } = useSmartLinkCreation();
  
  // Prevent navigation loops by tracking tab changes
  const isTabChangeInProgress = useRef(false);
  const lastTabUpdateTime = useRef(Date.now());

  // Handle URL parameter changes
  useEffect(() => {
    // Skip if a tab change is already being processed
    if (isTabChangeInProgress.current) return;
    
    // Skip if the change happened too recently (prevents rapid changes)
    const now = Date.now();
    if (now - lastTabUpdateTime.current < 300) return;
    
    const validTabs = ['smart-links', 'email-subscribers', 'promotions'];
    if (tabParam && validTabs.includes(tabParam)) {
      // Don't set state if it's already correct
      if (activeTab !== tabParam) {
        // Check if user has access to this tab
        if (tabParam === 'email-subscribers' && !isFeatureEnabled('email_capture')) {
          setShowUpgradeModal(true);
        } else {
          setActiveTab(tabParam as any);
        }
      }
    } else if (tabParam === null && activeTab !== 'smart-links') {
      // If no tab param but we're not on default tab, reset to default
      setActiveTab('smart-links');
    }
  }, [tabParam, isFeatureEnabled, setShowUpgradeModal, activeTab]);

  // Handle tab navigation and URL updates
  const handleTabClick = useCallback((tab: 'smart-links' | 'email-subscribers' | 'promotions') => {
    // Don't do anything if we're already on this tab
    if (tab === activeTab) return;
    
    // Check feature access
    if (tab === 'email-subscribers' && !isFeatureEnabled('email_capture')) {
      setShowUpgradeModal(true);
      return;
    }
    
    // Set loading state
    setIsTabLoading(true);
    
    // Prevent rapid tab changes
    isTabChangeInProgress.current = true;
    lastTabUpdateTime.current = Date.now();
    
    // Update URL to reflect tab change
    const newSearch = tab === 'smart-links' 
      ? '' 
      : `?tab=${tab}`;
      
    // Use replace:true to avoid growing history stack with tab changes
    navigate({
      pathname: '/dashboard',
      search: newSearch
    }, { replace: true });
    
    // Change tab
    setActiveTab(tab);
    
    // Reset flags and loading after a short delay
    setTimeout(() => {
      isTabChangeInProgress.current = false;
      setIsTabLoading(false);
    }, 300);
  }, [activeTab, isFeatureEnabled, navigate, setShowUpgradeModal]);

  const { data: subscription } = useQuery({
    queryKey: ["dashboard-subscription"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Separate queries to avoid join issues
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (subscriptionError) throw subscriptionError;
      
      // Default to free tier if no subscription data found
      const tier = subscriptionData?.tier || 'free';
      
      // Get features for this tier
      const { data: features, error: featuresError } = await supabase
        .from("subscription_features")
        .select("*")
        .eq("tier", tier);
        
      if (featuresError) throw featuresError;
      
      return {
        ...subscriptionData,
        features,
        tier
      };
    },
    // Add these options to prevent constant refetching
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
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
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: false,
  });

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* New Sidebar Navigation Banner */}
      <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layout className="h-5 w-5 text-primary" />
          <p className="text-sm font-medium">Try our new sidebar navigation layout for easier access to all features!</p>
        </div>
        <Link to="/dashboard-new">
          <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10">
            Try New Dashboard
          </Button>
        </Link>
      </div>
      
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
            <button
              onClick={() => handleTabClick('promotions')}
              className={cn(
                "pb-4 text-sm font-medium relative transition-colors hover:text-primary",
                activeTab === 'promotions'
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              )}
            >
              <span className="flex items-center gap-1.5">
                Playlist Promotions
                <HeadphonesIcon className="h-3.5 w-3.5 text-muted-foreground/70 group-hover:text-primary/70 transition-colors" />
              </span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[300px] animate-in fade-in-50 duration-200">
          {isTabLoading ? (
            <div className="flex items-center justify-center h-60">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : activeTab === 'smart-links' ? (
            <SmartLinksList links={links} isLoading={isLoading} />
          ) : activeTab === 'email-subscribers' ? (
            <EmailSubscribersList />
          ) : (
            <PromotionsDashboard />
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
