import { useQuery } from "@tanstack/react-query";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { SmartLinksList } from "@/components/dashboard/SmartLinksList";
import { EmailSubscribersList } from "@/components/dashboard/EmailSubscribersList";
import { SubscriptionBanner } from "@/components/subscription/SubscriptionBanner";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link2, ArrowLeftIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useSmartLinkCreation } from "@/hooks/useSmartLinkCreation";
import { PromotionsDashboard } from "@/components/spotify-promotion/PromotionsDashboard";
import { useLocation, Link } from "react-router-dom";
import { CampaignResultsDashboard } from "@/components/spotify-promotion/CampaignResultsDashboard";
import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const sectionParam = searchParams.get('section');
  const campaignId = searchParams.get('campaignId');

  // Default section is smart-links
  const [activeSection, setActiveSection] = useState<'smart-links' | 'email-subscribers' | 'promotions'>(sectionParam as any || 'smart-links');
  const [isLoading, setIsLoading] = useState(false);
  const [campaignDetails, setCampaignDetails] = useState<any>(null);
  
  const {
    isFeatureEnabled
  } = useFeatureAccess();
  const {
    handleCreateClick,
    showUpgradeModal,
    setShowUpgradeModal
  } = useSmartLinkCreation();

  // Fetch campaign details if campaignId is present
  useEffect(() => {
    if (campaignId && activeSection === 'promotions') {
      const fetchCampaignDetails = async () => {
        try {
          setIsLoading(true);
          const { data, error } = await supabase
            .from('promotions')
            .select('*')
            .eq('id', campaignId)
            .single();
          
          if (error) throw error;
          
          // Check if user owns this campaign
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Not authenticated");
          
          if (data.user_id !== user.id) {
            throw new Error("You do not have permission to view this campaign");
          }
          
          setCampaignDetails(data);
        } catch (err: any) {
          console.error('Error fetching campaign:', err);
          toast.error(err.message || 'Failed to load campaign details');
          setCampaignDetails(null);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchCampaignDetails();
    } else {
      setCampaignDetails(null);
    }
  }, [campaignId, activeSection]);

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
  return <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Subscription Banner */}
      <div className="bg-background/50 rounded-lg border border-border/50 overflow-hidden">
        <SubscriptionBanner />
      </div>
      
      {/* Dashboard Content Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          {activeSection === 'promotions' && campaignId && campaignDetails && (
            <div className="flex items-center">
              <Link to="/dashboard?section=promotions">
                <Button variant="ghost" size="sm" className="gap-1">
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span>Back to Campaigns</span>
                </Button>
              </Link>
              <div className="ml-4">
                <h2 className="text-xl font-medium">{campaignDetails.track_name}</h2>
                <p className="text-sm text-muted-foreground">{campaignDetails.track_artist}</p>
              </div>
            </div>
          )}
          
          {activeSection === 'smart-links' && <Button onClick={handleCreateClick} className="gap-2">
              <Link2 className="h-4 w-4" />
              Create Smart Link
            </Button>}
        </div>
        
        {/* Analytics Section - Only show in Smart Links section */}
        {!isLoading && activeSection === 'smart-links' && <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DashboardStats data={links} />
          </div>}

        {/* Content Area */}
        <div className="min-h-[300px] animate-in fade-in-50 duration-200">
          {isLoading ? <div className="flex items-center justify-center h-60">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div> : 
            activeSection === 'smart-links' ? (
              <SmartLinksList links={links} isLoading={isLinksLoading} />
            ) : activeSection === 'email-subscribers' ? (
              <EmailSubscribersList />
            ) : activeSection === 'promotions' && campaignId && campaignDetails ? (
              <Card>
                <CardContent className="p-6">
                  <CampaignResultsDashboard campaignId={campaignId} />
                </CardContent>
              </Card>
            ) : activeSection === 'promotions' ? (
              <PromotionsDashboard />
            ) : null}
        </div>
      </div>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} feature={activeSection === 'email-subscribers' ? "collect email subscribers" : "create more smart links"} description={activeSection === 'email-subscribers' ? "Upgrade to Pro to collect emails from your fans and build your mailing list!" : "You've reached the limit of smart links on the free plan. Upgrade to Pro for unlimited smart links and more features!"} />
    </div>;
}