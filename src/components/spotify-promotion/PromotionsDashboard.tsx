import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HeadphonesIcon, PlusCircleIcon, ExternalLinkIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatDistance } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { SpotifyTrackSearchModal } from "./SpotifyTrackSearchModal";

// This component provides consistent campaign creation experience across contexts
const NewCampaignButton = ({
  isPro,
  onOpenModal
}: {
  isPro: boolean;
  onOpenModal: () => void;
}) => {
  return <Button onClick={onOpenModal}>
      <PlusCircleIcon className="mr-2 h-4 w-4" />
      New Campaign {isPro && <span className="ml-1"></span>}
    </Button>;
};
export function PromotionsDashboard() {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const {
    data: userSubscription
  } = useQuery({
    queryKey: ["promotion-subscription"],
    queryFn: async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Separate queries to avoid join issues
      const {
        data: subscriptionData,
        error: subscriptionError
      } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).eq("status", "active").single();
      if (subscriptionError) throw subscriptionError;

      // Default to free tier if no subscription data found
      const tier = subscriptionData?.tier || 'free';

      // Get features for this tier
      const {
        data: features,
        error: featuresError
      } = await supabase.from("subscription_features").select("*").eq("tier", tier);
      if (featuresError) throw featuresError;
      return {
        ...subscriptionData,
        features,
        tier
      };
    },
    // Add these options to prevent constant refetching
    staleTime: 1000 * 60 * 5,
    // 5 minutes
    refetchOnWindowFocus: false
  });
  const {
    data: promotions,
    isLoading,
    refetch: refetchPromotions
  } = useQuery({
    queryKey: ["user-promotions"],
    queryFn: async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const {
        data,
        error
      } = await supabase.from("promotions").select("*").eq("user_id", user.id).order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 1,
    // 1 minute
    refetchOnWindowFocus: false
  });
  const isPro = userSubscription?.tier === "pro";

  // Refetch promotions when the modal closes (to show newly created campaigns)
  const handleModalClose = () => {
    setIsSearchModalOpen(false);
    refetchPromotions();
  };
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Spotify Playlist Promotions</h2>
          <p className="text-muted-foreground">Boost your music with playlist placements</p>
        </div>
        <NewCampaignButton isPro={isPro} onOpenModal={() => setIsSearchModalOpen(true)} />
      </div>
      
      {isLoading ? <PromotionsSkeleton /> : promotions?.length === 0 ? <EmptyPromotionsState isPro={isPro} onOpenModal={() => setIsSearchModalOpen(true)} /> : <div className="space-y-4">
          {promotions.map((campaign: any) => <CampaignCard key={campaign.id} campaign={campaign} />)}
        </div>}
      
      <SpotifyTrackSearchModal isOpen={isSearchModalOpen} onClose={handleModalClose} />
    </div>;
}
function CampaignCard({
  campaign
}: {
  campaign: any;
}) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    completed: "bg-blue-100 text-blue-800",
    cancelled: "bg-red-100 text-red-800"
  };
  return <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">{campaign.track_name}</h3>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Tier: {campaign.package_tier}</span>
              <span>•</span>
              <span>{formatDistance(new Date(campaign.created_at), new Date(), {
                addSuffix: true
              })}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className={statusColors[campaign.status] || "bg-gray-100 text-gray-800"} variant="outline">
              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
            </Badge>
            {campaign.status === "active" || campaign.status === "completed" ? <Link to={`/dashboard?section=promotions&campaignId=${campaign.id}`}>
                <Button variant="outline" size="sm" className="gap-1">
                  <span>View Details</span>
                  <ExternalLinkIcon className="h-3 w-3" />
                </Button>
              </Link> : null}
          </div>
        </div>
        <div className="mt-4 text-sm">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div>
              <div className="font-medium">Submissions</div>
              <div>{campaign.submission_count}</div>
            </div>
            <div>
              <div className="font-medium">Playlist Adds</div>
              <div>{campaign.approval_count || 'Pending'}</div>
            </div>
            <div>
              <div className="font-medium">Est. Streams</div>
              <div>{campaign.estimated_streams || (campaign.approval_count ? campaign.approval_count * 250 : 'Pending')}</div>
            </div>
            <div>
              <div className="font-medium">Price</div>
              <div>${campaign.total_cost}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
}
function EmptyPromotionsState({
  isPro,
  onOpenModal
}: {
  isPro: boolean;
  onOpenModal: () => void;
}) {
  return <Card className="p-8 text-center">
      <HeadphonesIcon className="mx-auto h-12 w-12 text-primary opacity-50 mb-4" />
      <h3 className="text-lg font-medium mb-2">No promotion campaigns yet</h3>
      <p className="text-muted-foreground mb-6">
        Get your music heard by new listeners through our curated playlist promotion service.
        {isPro && <span className="text-primary font-medium"> Pro users get 10% off all campaigns!</span>}
      </p>
      <Button onClick={onOpenModal}>Start Your First Campaign</Button>
    </Card>;
}
function PromotionsSkeleton() {
  return <div className="space-y-4">
      {[1, 2].map(i => <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-60" />
              </div>
              <div className="flex items-center space-x-3">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-9 w-28" />
              </div>
            </div>
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[1, 2, 3, 4].map(j => <div key={j} className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>)}
              </div>
            </div>
          </CardContent>
        </Card>)}
    </div>;
}