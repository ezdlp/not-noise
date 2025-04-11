import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  HeadphonesIcon, 
  PlusCircleIcon, 
  ExternalLinkIcon, 
  CreditCardIcon, 
  Loader2,
  MusicIcon,
  Trash2
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatDistance, addDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { SpotifyTrackSearchModal } from "./SpotifyTrackSearchModal";
import { resumePaymentFlow } from "@/lib/promotion-utils";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const NewCampaignButton = ({
  isPro,
  onOpenModal
}: {
  isPro: boolean;
  onOpenModal: () => void;
}) => {
  return (
    <Button onClick={onOpenModal}>
      <PlusCircleIcon className="mr-2 h-4 w-4" />
      New Campaign {isPro && <span className="ml-1"></span>}
    </Button>
  );
};

export function PromotionsDashboard() {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);
  
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
  
  const handleCompletePayment = async (campaignId: string) => {
    try {
      setIsProcessingPayment(campaignId);
      await resumePaymentFlow(campaignId);
    } catch (error) {
      console.error("Failed to resume payment:", error);
      toast({
        title: "Payment Error",
        description: "We couldn't process your payment request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(null);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Spotify Playlist Promotions</h2>
          <p className="text-muted-foreground">Boost your music with playlist placements</p>
        </div>
        <NewCampaignButton isPro={isPro} onOpenModal={() => setIsSearchModalOpen(true)} />
      </div>
      
      {isLoading ? (
        <PromotionsSkeleton />
      ) : promotions?.length === 0 ? (
        <EmptyPromotionsState isPro={isPro} onOpenModal={() => setIsSearchModalOpen(true)} />
      ) : (
        <div className="space-y-4">
          {promotions.map((campaign: any) => (
            <CampaignCard 
              key={campaign.id} 
              campaign={campaign} 
              isProcessingPayment={isProcessingPayment === campaign.id}
              onCompletePayment={handleCompletePayment}
            />
          ))}
        </div>
      )}
      
      <SpotifyTrackSearchModal isOpen={isSearchModalOpen} onClose={handleModalClose} />
    </div>
  );
}

function CampaignCard({
  campaign,
  isProcessingPayment,
  onCompletePayment
}: {
  campaign: any;
  isProcessingPayment: boolean;
  onCompletePayment: (campaignId: string) => void;
}) {
  const [trackArtwork, setTrackArtwork] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const statusColors = {
    payment_pending: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    delivered: "bg-blue-100 text-blue-800",
    cancelled: "bg-red-100 text-red-800"
  };
  
  // Get display status label based on status value
  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'payment_pending': return 'Payment Pending';
      case 'active': return 'Active';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  // Calculate campaign day (assuming 7-day delivery by default)
  const calculateCampaignDay = () => {
    if (campaign.status === 'payment_pending') return 0;
    if (campaign.status === 'delivered') return campaign.duration_days || 7; // Return total duration if delivered
    
    const creationDate = new Date(campaign.created_at);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - creationDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.min(diffDays, campaign.duration_days || 7);
  };
  
  // Get campaign day message
  const getCampaignDayMessage = (day: number) => {
    const totalDays = campaign.duration_days || 7;
    
    // Campaign is in day 6+ and past standard week but not delivered yet
    if (day >= 6 && day < totalDays && totalDays > 7) {
      return "Final push! We're following up with remaining curators to maximize your playlist placements.";
    }
    
    switch(day) {
      case 0:
        return "Waiting for payment to start your campaign";
      case 1:
        return "Track analysis in progress. We're identifying the perfect playlist matches for your sound.";
      case 2:
      case 3:
        return "Your track is now being pitched to our network of playlist curators who specialize in your genre.";
      case 4:
        return "Curators are reviewing your track. Initial responses are coming in while others are still evaluating.";
      case 5:
        return "Positive responses are arriving! About 60% of curators have reviewed your submission so far.";
      case 6:
        return "Final push! We're following up with remaining curators to maximize your playlist placements.";
      default:
        // Only show completion message if actually delivered
        return campaign.status === 'delivered' 
          ? "Campaign complete! Your full results and playlist placements are now available."
          : "We're finalizing your playlist placements. Results coming soon!";
    }
  };
  
  // Get next update message
  const getNextUpdateMessage = (day: number) => {
    const totalDays = campaign.duration_days || 7;
    
    if (day === 0) return "Starts after payment";
    if (campaign.status === 'delivered') {
      return (
        <Link to={`/dashboard?section=promotions&campaignId=${campaign.id}`} className="inline-flex items-center hover:underline">
          View Campaign Report
          <ExternalLinkIcon className="h-3 w-3 ml-1" />
        </Link>
      );
    }
    
    // Extended campaign message
    if (day >= 6 && day < totalDays && totalDays > 7) {
      return "Next update: Tomorrow by 6PM";
    }
    
    if (day === 1 || day === 4 || day === 5 || day === 6) {
      return "Next update: Tomorrow by 6PM";
    } else if (day === 2 || day === 3) {
      return "Next update: In 48 hours";
    }
    
    return "Updates coming soon";
  };
  
  // Fetch Spotify track artwork
  useEffect(() => {
    if (campaign?.spotify_track_id) {
      const fetchSpotifyTrack = async () => {
        try {
          const { data: trackData, error } = await supabase.functions.invoke('spotify-search', {
            body: { url: campaign.spotify_track_id }
          });
          
          if (error) {
            console.error('Error fetching Spotify track:', error);
            return;
          }
          
          if (trackData && trackData.artworkUrl) {
            setTrackArtwork(trackData.artworkUrl);
          }
        } catch (err) {
          console.error('Failed to fetch track artwork:', err);
        }
      };
      
      fetchSpotifyTrack();
    }
  }, [campaign?.spotify_track_id]);
  
  const campaignDay = calculateCampaignDay();
  const totalDays = campaign.duration_days || 7;
  const progressPercentage = (campaignDay / totalDays) * 100;
  
  const defaultArtwork = "https://placehold.co/400x400/6851FB/FFFFFF?text=Track+Artwork";
  const artworkUrl = trackArtwork || campaign.artwork_url || defaultArtwork;
  const capitalizedTier = campaign.package_tier 
    ? campaign.package_tier.charAt(0).toUpperCase() + campaign.package_tier.slice(1) 
    : 'Standard';
  
  // Handle campaign deletion
  const handleDeleteCampaign = async () => {
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', campaign.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Campaign Deleted",
        description: "Your campaign has been successfully removed.",
      });
      
      // Force a refresh of the page to update the UI
      window.location.reload();
      
    } catch (error: any) {
      console.error("Error deleting campaign:", error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Artwork Section */}
        <div className="relative w-full md:w-48 h-48 md:h-auto">
          <img 
            src={artworkUrl}
            alt={`${campaign.track_name} by ${campaign.track_artist}`}
            className="w-full h-48 object-cover md:w-48 md:h-full"
          />
          <div className="absolute top-2 right-2">
            <Badge className={statusColors[campaign.status] || "bg-gray-100 text-gray-800"} variant="outline">
              {getStatusDisplay(campaign.status)}
            </Badge>
          </div>
          <div className="absolute bottom-2 left-2">
            <Badge className="bg-primary/80 text-white">{capitalizedTier}</Badge>
          </div>
        </div>
        
        {/* Content Section */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            {/* Track Info & Actions */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{campaign.track_name}</h3>
                <p className="text-muted-foreground">{campaign.track_artist}</p>
                <div className="text-xs text-muted-foreground mt-1">
                  Created {formatDistance(new Date(campaign.created_at), new Date(), {
                    addSuffix: true
                  })}
                </div>
              </div>
              <div>
                {campaign.status === 'payment_pending' ? (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1"
                      disabled={isProcessingPayment}
                      onClick={() => onCompletePayment(campaign.id)}
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCardIcon className="h-3 w-3 mr-1" />
                          <span>Complete Payment</span>
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="gap-1 text-red-500 hover:text-red-700"
                      onClick={() => setIsDeleteDialogOpen(true)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : campaign.status === "active" || campaign.status === "delivered" ? (
                  <Link to={`/dashboard?section=promotions&campaignId=${campaign.id}`}>
                    <Button variant="outline" size="sm" className="gap-1">
                      <span>View Details</span>
                      <ExternalLinkIcon className="h-3 w-3" />
                    </Button>
                  </Link>
                ) : null}
              </div>
            </div>
            
            {/* Campaign Progress Timeline */}
            {campaign.status !== 'payment_pending' && campaign.status !== 'cancelled' && (
              <div className="mb-4">
                <div className="flex justify-between items-center text-sm mb-1.5">
                  <span className="font-medium">Campaign Progress</span>
                  <span className="text-xs text-muted-foreground">Day {campaignDay} of {totalDays}</span>
                </div>
                <Progress value={progressPercentage} className="h-2 mb-2" />
                <div className="text-sm text-muted-foreground mb-1">
                  {getCampaignDayMessage(campaignDay)}
                </div>
                <div className="text-xs text-primary font-medium">
                  {getNextUpdateMessage(campaignDay)}
                </div>
              </div>
            )}
          </div>
          
          {/* Metrics Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="text-xs uppercase font-medium text-muted-foreground">Submissions</div>
              <div className="text-lg font-semibold">{campaign.submission_count || 0}</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="text-xs uppercase font-medium text-muted-foreground">Approval Rate</div>
              <div className="text-lg font-semibold">
                {campaign.approval_count && campaign.submission_count 
                  ? ((campaign.approval_count / campaign.submission_count) * 100).toFixed(1) 
                  : '0.0'}%
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="text-xs uppercase font-medium text-muted-foreground">Approved</div>
              <div className="text-lg font-semibold">{campaign.approval_count || 0}</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="text-xs uppercase font-medium text-muted-foreground">Est. Streams</div>
              <div className="text-lg font-semibold">{campaign.estimated_streams || (campaign.approval_count ? campaign.approval_count * 250 : '0')}+</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the campaign "{campaign.track_name}" from your dashboard. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCampaign} 
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Campaign"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function EmptyPromotionsState({
  isPro,
  onOpenModal
}: {
  isPro: boolean;
  onOpenModal: () => void;
}) {
  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-8 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <HeadphonesIcon className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Get Your Music Heard</h3>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Boost your music with our curated playlist promotion service. Get your tracks in front of new listeners and grow your audience.
          {isPro && <span className="text-primary font-medium"> Pro users enjoy 10% off all campaigns!</span>}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-muted-foreground mb-6 max-w-2xl mx-auto">
          <div className="bg-white/60 p-4 rounded-lg shadow-sm">
            <div className="font-medium text-primary mb-1">Targeted Promotion</div>
            <p>Your music is pitched to playlist curators who specialize in your genre.</p>
          </div>
          <div className="bg-white/60 p-4 rounded-lg shadow-sm">
            <div className="font-medium text-primary mb-1">Real Results</div>
            <p>Track your campaign progress and see exactly where your music is being placed.</p>
          </div>
          <div className="bg-white/60 p-4 rounded-lg shadow-sm">
            <div className="font-medium text-primary mb-1">7-Day Delivery</div>
            <p>Start seeing results quickly with our streamlined promotion process.</p>
          </div>
        </div>
        <Button onClick={onOpenModal} className="px-8" size="lg">
          <PlusCircleIcon className="mr-2 h-4 w-4" />
          Start Your First Campaign
        </Button>
      </div>
    </Card>
  );
}

function PromotionsSkeleton() {
  return <div className="space-y-4">
      {[1, 2].map(i => (
        <Card key={i} className="overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Artwork Skeleton */}
            <div className="relative w-full md:w-48 h-48 md:h-auto">
              <Skeleton className="w-full h-48 md:w-48 md:h-full absolute" />
              <div className="absolute top-2 right-2">
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="absolute bottom-2 left-2">
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
            
            {/* Content Skeleton */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                {/* Track Info & Actions Skeleton */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-36 mb-2" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <div>
                    <Skeleton className="h-9 w-28" />
                  </div>
                </div>
                
                {/* Campaign Progress Timeline Skeleton */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              
              {/* Metrics Skeleton */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                {[1, 2, 3, 4].map(j => (
                  <div key={j} className="bg-muted/30 rounded-lg p-3 text-center">
                    <Skeleton className="h-3 w-16 mx-auto mb-2" />
                    <Skeleton className="h-6 w-10 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>;
}
