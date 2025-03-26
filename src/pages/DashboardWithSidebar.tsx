import { useQuery } from "@tanstack/react-query";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { SmartLinksList } from "@/components/dashboard/SmartLinksList";
import { EmailSubscribersList } from "@/components/dashboard/EmailSubscribersList";
import { SubscriptionBanner } from "@/components/subscription/SubscriptionBanner";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";
import { useState, useEffect } from "react";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useSmartLinkCreation } from "@/hooks/useSmartLinkCreation";
import { PromotionsDashboard } from "@/components/spotify-promotion/PromotionsDashboard";
import { useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export default function Dashboard() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const sectionParam = searchParams.get('section');

  // Default section is smart-links
  const [activeSection, setActiveSection] = useState<'smart-links' | 'email-subscribers' | 'promotions'>(
    sectionParam as any || 'smart-links'
  );
  const [isLoading, setIsLoading] = useState(false);
  const {
    isFeatureEnabled
  } = useFeatureAccess();
  const {
    handleCreateClick,
    showUpgradeModal,
    setShowUpgradeModal
  } = useSmartLinkCreation();

  // Handle URL parameter changes
  useEffect(() => {
    const validSections = ['smart-links', 'email-subscribers', 'promotions'];
    if (sectionParam && validSections.includes(sectionParam)) {
      // Check if user has access to this section
      if (sectionParam === 'email-subscribers' && !isFeatureEnabled('email_capture')) {
        setShowUpgradeModal(true);
      } else {
        setActiveSection(sectionParam as any);
      }
    }
  }, [sectionParam, isFeatureEnabled, setShowUpgradeModal]);

  const {
    data: links,
    isLoading: isLinksLoading
  } = useQuery({
    queryKey: ["smartLinks"],
    queryFn: async () => {
      const {
        data: user
      } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const {
        data,
        error
      } = await supabase.from("smart_links").select(`
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
        `).eq('user_id', user.user.id).order("created_at", {
        ascending: false
      });
      if (error) {
        toast.error("Failed to load smart links");
        throw error;
      }
      return data;
    },
    staleTime: 1000 * 30,
    // 30 seconds
    refetchOnWindowFocus: false
  });

  // Handle section title display
  const getSectionTitle = () => {
    switch (activeSection) {
      case 'smart-links':
        return 'Smart Links';
      case 'email-subscribers':
        return 'Email Subscribers';
      case 'promotions':
        return 'Spotify Playlist Promotions';
      default:
        return 'Dashboard';
    }
  };

  return (
    <SidebarProvider>
      <div className="relative flex h-screen w-full overflow-hidden bg-neutral-seasalt">
        <DashboardSidebar />
        
        <div className="flex-1 overflow-auto ml-64">
          <div className="container mx-auto py-6 px-4 space-y-6">
            {/* Subscription Banner */}
            <div className="bg-background/50 rounded-lg border border-border/50 overflow-hidden">
              <SubscriptionBanner />
            </div>
            
            {/* Dashboard Content Section */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">{getSectionTitle()}</h1>
                
                {activeSection === 'smart-links' && (
                  <Button onClick={handleCreateClick} className="gap-2">
                    <Link2 className="h-4 w-4" />
                    Create Smart Link
                  </Button>
                )}
              </div>
              
              {/* Analytics Section - Only show in Smart Links section */}
              {!isLoading && activeSection === 'smart-links' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <DashboardStats data={links} />
                </div>
              )}

              {/* Content Area */}
              <div className="min-h-[300px] animate-in fade-in-50 duration-200">
                {isLoading ? (
                  <div className="flex items-center justify-center h-60">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : activeSection === 'smart-links' ? (
                  <SmartLinksList links={links} isLoading={isLinksLoading} />
                ) : activeSection === 'email-subscribers' ? (
                  <EmailSubscribersList />
                ) : activeSection === 'promotions' ? (
                  <PromotionsDashboard />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        feature={activeSection === 'email-subscribers' ? "collect email subscribers" : "create more smart links"} 
        description={activeSection === 'email-subscribers' ? "Upgrade to Pro to collect emails from your fans and build your mailing list!" : "You've reached the limit of smart links on the free plan. Upgrade to Pro for unlimited smart links and more features!"} 
      />
    </SidebarProvider>
  );
}
