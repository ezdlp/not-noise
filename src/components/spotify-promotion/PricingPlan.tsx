import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PromotionSignupModal } from "./PromotionSignupModal";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { PricingTier, SelectedTrack } from "@/types/spotify-promotion";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

interface PricingPlanProps {
  onSubmit?: (submissions: number, totalCost: number) => void;
  selectedTrack?: SelectedTrack;
}

const PricingPlan: React.FC<PricingPlanProps> = ({ onSubmit, selectedTrack }) => {
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  
  const { subscription, isLoading: subscriptionLoading } = useFeatureAccess();
  const isPro = subscription?.tier === 'pro';

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const tiers: PricingTier[] = [
    {
      name: "Silver",
      submissions: 20,
      minAdds: 4,
      maxAdds: 5,
      price: 220,
      discount: 0,
      vinylImage: "/lovable-uploads/430f856f-d860-4675-9520-bd9e1742c166.png",
      priceId: "price_1QpCdhFx6uwYcH3SqX5B02x3",
      features: [
        "Basic Production & Songwriting Notes",
        "Final Report After Campaign Completion",
        "Results Delivered Within 14 Days",
        "Standard Support (48hr Response)"
      ]
    },
    {
      name: "Gold",
      submissions: 35,
      minAdds: 7,
      maxAdds: 8,
      price: 385,
      discount: 5,
      popular: true,
      vinylImage: "/lovable-uploads/61ec2009-eb22-49fe-a6b9-4097a874f871.png",
      priceId: "price_1QpCecFx6uwYcH3S7TqiqXmo",
      features: [
        "Detailed A&R Feedback Report",
        "Enhanced Curator Matching",
        "Results Delivered Within 10 Days",
        "Priority Support (24hr Response)",
        "Campaign Performance Analysis"
      ]
    },
    {
      name: "Platinum",
      submissions: 50,
      minAdds: 11,
      maxAdds: 12,
      price: 500,
      discount: 10,
      vinylImage: "/lovable-uploads/1c6cea71-32b6-4dcc-a0da-490b91abb2aa.png",
      priceId: "price_1QpCf7Fx6uwYcH3SClLj92Pf",
      features: [
        "Comprehensive A&R Development Plan",
        "Song Structure Analysis",
        "Next Release Strategy Consultation",
        "Results Delivered Within 7 Days",
        "VIP Support (12hr Response)",
        "Genre-specific Mix Recommendations"
      ]
    }
  ];

  const calculateMetrics = (tier: PricingTier) => {
    const minStreams = tier.minAdds * 450;
    const maxStreams = tier.maxAdds * 450;
    const originalPrice = tier.price / (1 - tier.discount / 100);
    const savings = tier.discount > 0 ? originalPrice - tier.price : 0;

    return {
      streams: `${minStreams.toLocaleString()}-${maxStreams.toLocaleString()}`,
      savings: savings.toFixed(2),
      originalPrice: originalPrice.toFixed(2)
    };
  };

  const handleSelect = async (tier: PricingTier) => {
    if (!selectedTrack) {
      toast({
        title: "No track selected",
        description: "Please select a track first",
        variant: "destructive"
      });
      return;
    }

    setSelectedTier(tier);

    if (isAuthenticated) {
      handleCheckout(tier);
    } else {
      setShowSignupModal(true);
    }
  };

  const normalizeTrackId = (trackId: string) => {
    if (trackId.startsWith('spotify:track:')) {
      return trackId;
    }
    
    if (trackId.includes('spotify.com/track/')) {
      const parts = trackId.split('/track/');
      const id = parts[1]?.split('?')[0];
      return id ? `spotify:track:${id}` : trackId;
    }
    
    if (/^[a-zA-Z0-9]{22}$/.test(trackId)) {
      return `spotify:track:${trackId}`;
    }
    
    return trackId;
  };

  const handleCheckout = async (tier: typeof tiers[0]) => {
    try {
      setIsProcessing(true);
      setCheckoutError(null);
      
      if (!selectedTrack) {
        toast({
          title: "No track selected",
          description: "Please select a track before checkout",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      const finalPrice = isPro ? Math.round(tier.price * 0.75) : tier.price;
      
      const packageId = getPackageId(tier.name);
      
      const spotifyTrackId = selectedTrack.id || '';
      
      console.log('Initiating checkout:', {
        packageId,
        trackId: spotifyTrackId,
        artistId: selectedTrack.artistId,
        price: finalPrice,
        isPro
      });
      
      try {
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: {
            packageId,
            trackId: spotifyTrackId,
            artistId: selectedTrack.artistId,
            trackName: selectedTrack.title,
            artistName: selectedTrack.artist,
            genre: selectedTrack.genre || 'other',
            basePrice: finalPrice,
            discountApplied: isPro
          }
        });

        if (error) {
          console.error('Checkout error:', error);
          setCheckoutError(`Error: ${error.message || 'Failed to create checkout session'}`);
          throw new Error(error.message || 'Failed to create checkout session');
        }
        
        if (!data?.checkoutUrl) {
          console.error('No checkout URL received:', data);
          setCheckoutError("Error: Unable to create checkout session. Please try again or contact support.");
          throw new Error('Unable to create checkout session');
        }
        
        try {
          localStorage.setItem('lastPromotionTrack', JSON.stringify({
            title: selectedTrack.title,
            artist: selectedTrack.artist,
            id: selectedTrack.id,
            packageId: packageId
          }));
        } catch (storageError) {
          console.warn('Could not save to localStorage:', storageError);
        }
        
        window.location.href = data.checkoutUrl;
        
      } catch (apiError) {
        console.error('API error during checkout:', apiError);
        throw apiError;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Checkout Error",
        description: error instanceof Error ? error.message : "There was an error processing your request. Please try again.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }

    if (onSubmit) {
      onSubmit(tier.submissions, tier.price);
    }
  };

  const calculatePrice = (basePrice: number) => {
    if (isPro) {
      const discountedPrice = basePrice * 0.75;
      return discountedPrice.toFixed(2);
    }
    return basePrice.toFixed(2);
  };

  const getPackageId = (tierName: string): string => {
    switch (tierName.toLowerCase()) {
      case 'silver':
        return 'silver';
      case 'gold':
        return 'gold';
      case 'platinum':
        return 'platinum';
      default:
        return 'silver';
    }
  };

  if (isLoading || subscriptionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="container py-12 px-4 mx-auto">
        {isPro ? (
          <div className="mb-8 bg-gradient-to-r from-primary/20 to-primary/10 backdrop-blur-sm border border-primary/30 rounded-lg overflow-hidden shadow-md">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary text-white p-2 rounded-full shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-primary drop-shadow-sm">PRO Subscriber Benefit Active</h4>
                  <p className="text-black/75 font-medium">
                    You're receiving a 25% discount on all promotion packages!
                  </p>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="bg-primary/20 border border-primary/30 px-3 py-1.5 rounded-md">
                  <span className="text-primary font-bold">25% OFF</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur-sm border border-primary/20 rounded-lg overflow-hidden shadow-md">
            <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 text-primary p-2 rounded-full shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-primary drop-shadow-sm">Upgrade to PRO</h4>
                  <p className="text-black/75 font-medium">
                    PRO members get 25% off all promotion packages!
                  </p>
                </div>
              </div>
              <div>
                <Button variant="default" size="sm" className="font-medium bg-primary hover:bg-primary/90" onClick={() => window.location.href = '/pricing'}>
                  Upgrade Now
                </Button>
              </div>
            </div>
          </div>
        )}

        {checkoutError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Checkout Error</AlertTitle>
            <AlertDescription>
              {checkoutError}
              <div className="mt-2">
                <p className="text-sm">Please try again or contact our support team if the problem persists.</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-8">
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((tier) => {
              const metrics = calculateMetrics(tier);
              const followersPerPlaylist = 8000;
              const totalReach = tier.submissions * followersPerPlaylist;
              const formattedReach = (totalReach).toLocaleString();
              const proDiscount = Math.round(tier.price * 0.25);
              
              return (
                <Card 
                  key={tier.name}
                  className={cn(
                    "relative flex flex-col justify-between backdrop-blur-xl bg-gradient-to-b from-black/30 to-black/50 border-white/30 transition-all duration-300 hover:shadow-xl text-white shadow-lg",
                    tier.popular && "md:scale-105 border-primary shadow-xl"
                  )}
                  style={{
                    background: "linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.6))",
                    backdropFilter: "blur(12px)"
                  }}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 left-0 right-0 mx-auto w-fit px-4 py-1 bg-primary text-white text-sm rounded-full font-medium">
                      Most Popular
                    </div>
                  )}
                  
                  <div>
                    <CardHeader className="text-center pb-4">
                      <div className="relative w-32 h-32 mx-auto mb-6 group-hover:scale-105 transition-all duration-300">
                        <img 
                          src={tier.vinylImage}
                          alt={`${tier.name} vinyl`}
                          className="w-full h-full animate-float drop-shadow-2xl"
                        />
                      </div>
                      <div className="text-center">
                        <h3 className="text-2xl font-semibold text-white drop-shadow-md">{tier.name} Edition</h3>
                        <div className="mt-3 mb-2">
                          {isPro ? (
                            <>
                              <div className="flex items-center justify-center gap-2 mb-1">
                                <span className="text-2xl text-white/70 line-through font-medium drop-shadow-sm">${tier.price}</span>
                                <span className="bg-primary px-2 py-0.5 rounded-md text-white text-xs font-medium">PRO SAVE ${Math.round(tier.price * 0.25)}</span>
                              </div>
                              <p className="text-4xl font-bold text-white drop-shadow-md">
                                ${Math.round(tier.price * 0.75)}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-4xl font-bold mb-2 text-white drop-shadow-md">
                                ${tier.price}
                              </p>
                              <div className="bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 px-3 py-2 rounded-lg mb-1">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                  <div className="text-sm text-primary/90 font-medium">With PRO:</div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-primary font-bold">${Math.round(tier.price * 0.75)}</span>
                                    <span className="bg-primary px-2 py-0.5 rounded text-white text-xs font-semibold">SAVE ${Math.round(tier.price * 0.25)}</span>
                                  </div>
                                </div>
                                <Button 
                                  variant="link" 
                                  className="text-xs p-0 h-auto text-primary font-semibold"
                                  onClick={() => window.location.href = '/pricing'}
                                >
                                  Upgrade to PRO
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="text-center">
                      <div className="space-y-4 mb-6">
                        <div>
                          <div className="flex items-center justify-center mb-1">
                            <p className="text-lg font-medium text-white drop-shadow-md">{formattedReach}+</p>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span><Info className="h-4 w-4 ml-1 text-white/70" /></span>
                              </TooltipTrigger>
                              <TooltipContent>
                                Combined followers of all playlists we pitch to
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <p className="text-sm text-white/80 drop-shadow-sm">Potential Playlist Reach</p>
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-center mb-1">
                            <p className="text-lg font-medium text-white drop-shadow-md">{tier.submissions}</p>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span><Info className="h-4 w-4 ml-1 text-white/70" /></span>
                              </TooltipTrigger>
                              <TooltipContent>
                                Number of playlist curators we contact
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <p className="text-sm text-white/80 drop-shadow-sm">Personalized Submissions</p>
                        </div>
                      </div>
                      
                      <div className="border-t border-white/30 pt-4">
                        <p className="text-sm font-medium text-white mb-2 drop-shadow-sm">What's included:</p>
                        <ul className="space-y-2 text-left text-sm">
                          {tier.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-primary font-bold drop-shadow-sm">✓</span>
                              <span className="text-white/90 drop-shadow-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </div>
                  
                  <CardFooter>
                    <Button 
                      className={cn(
                        "w-full rounded-lg text-base font-medium py-5 transition-all duration-300 shadow-md",
                        tier.popular ? 
                          "bg-primary hover:bg-primary/90 text-white" : 
                          "bg-white hover:bg-white/90 text-primary hover:text-primary/90"
                      )}
                      onClick={() => handleSelect(tier)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <span className="animate-spin mr-2">◌</span> 
                          Processing...
                        </>
                      ) : (
                        <>Select {tier.name} Plan</>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 mt-8 border border-[#0F0F0F]/10">
            <div className="flex items-center justify-center gap-2 text-[#0F0F0F]/80">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span className="text-sm font-medium">100% Money-back Guarantee</span>
            </div>
          </div>

          <p className="text-sm text-[#0F0F0F]/60 text-center">
            * Expected playlist adds and streams are estimates based on historical data
          </p>
        </div>

        {selectedTier && !isAuthenticated && (
          <PromotionSignupModal
            isOpen={showSignupModal}
            onClose={() => setShowSignupModal(false)}
            onSuccess={() => handleCheckout(selectedTier!)}
            selectedPackage={{
              name: selectedTier.name,
              submissions: selectedTier.submissions,
              price: selectedTier.price
            }}
          />
        )}
      </div>
    </>
  );
};

export default PricingPlan;
