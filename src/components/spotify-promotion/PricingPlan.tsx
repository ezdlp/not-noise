import React, { useState } from "react";
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
import { useEffect } from "react";

interface PricingPlanProps {
  onSubmit?: (submissions: number, totalCost: number) => void;
  selectedTrack?: {
    title: string;
    artist: string;
    id: string;
    artistId: string;
    genre?: string;
  };
}

interface PricingTier {
  name: string;
  submissions: number;
  minAdds: number;
  maxAdds: number;
  price: number;
  discount: number;
  popular?: boolean;
  features: string[];
  vinylImage: string;
  priceId: string;
}

const PricingPlan: React.FC<PricingPlanProps> = ({ onSubmit, selectedTrack }) => {
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Check initial auth state
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setIsLoading(false);
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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
        "Playlist Curator Feedback",
        "Basic A&R Feedback",
        "Basic Support (response in less than 48hs)",
        "Final report delivered in 14 days"
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
        "Playlist Curator Feedback",
        "Detailed A&R Feedback",
        "Priority Support (response in less than 24hs)",
        "Final report delivered in 10 days"
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
        "Playlist Curator Feedback",
        "Extensive A&R & Production Development Plan",
        "Concierge Support (response in less than 12hs)",
        "Final report delivered in 7 days",
        "Song Structure Analysis",
        "Next Release Strategy Planning",
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
      // If user is authenticated, proceed directly to checkout
      handleCheckout(tier);
    } else {
      // If user is not authenticated, show signup modal
      setShowSignupModal(true);
    }
  };

  const handleCheckout = async (tier: PricingTier = selectedTier!) => {
    if (!tier || !selectedTrack) return;

    try {
      setIsProcessing(true);
      
      console.log('Creating checkout session for:', {
        tier: tier.name,
        price: tier.price,
        track: selectedTrack.title
      });
      
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: tier.priceId,
          isSubscription: false, // Explicitly mark as non-subscription
          promotionData: {
            trackName: selectedTrack.title,
            trackArtist: selectedTrack.artist,
            spotifyTrackId: selectedTrack.id,
            spotifyArtistId: selectedTrack.artistId,
            submissionCount: tier.submissions,
            estimatedAdditions: tier.maxAdds,
            genre: selectedTrack.genre || 'other'
          }
        }
      });

      if (error) {
        console.error('Error response from function:', error);
        throw new Error(`Checkout error: ${error.message}`);
      }
      
      if (!data?.url) {
        console.error('Invalid response:', data);
        throw new Error('No checkout URL received');
      }

      // Log success before redirect
      console.log('Redirecting to Stripe checkout:', data.url.substring(0, 50) + '...');

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "There was an error processing your request. Please try again.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }

    if (onSubmit) {
      onSubmit(tier.submissions, tier.price);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tier) => {
            const metrics = calculateMetrics(tier);
            return (
              <Card 
                key={tier.name}
                className={cn(
                  "relative flex flex-col justify-between backdrop-blur-xl bg-white/20 border-white/20 transition-all duration-300 hover:shadow-xl text-white",
                  tier.popular && "md:scale-105 border-primary shadow-lg"
                )}
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
                      <h3 className="text-2xl font-semibold text-white">{tier.name}</h3>
                      <p className="text-4xl font-bold mb-2 text-white">
                        ${tier.price}
                        {tier.discount > 0 && (
                          <span className="text-sm text-white/80 ml-2 line-through">
                            ${metrics.originalPrice}
                          </span>
                        )}
                      </p>
                      {tier.discount > 0 && (
                        <p className="text-sm text-white/90 mb-2">
                          Save ${metrics.savings}
                        </p>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="text-center">
                    <div className="space-y-4 mb-6">
                      <div>
                        <div className="flex items-center justify-center mb-1">
                          <p className="text-lg font-medium text-white">{tier.submissions}</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span><Info className="h-4 w-4 ml-1 text-white/70" /></span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Number of playlists we will submit your track to
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-sm text-white/80">Playlist Submissions</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-center mb-1">
                          <p className="text-lg font-medium text-white">{tier.minAdds}-{tier.maxAdds}</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span><Info className="h-4 w-4 ml-1 text-white/70" /></span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Expected number of playlist placements
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-sm text-white/80">Guaranteed Playlist Adds</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-center mb-1">
                          <p className="text-lg font-medium text-white">{metrics.streams}</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span><Info className="h-4 w-4 ml-1 text-white/70" /></span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Estimated range based on average playlist streams
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-sm text-white/80">Estimated Streams</p>
                      </div>
                    </div>
                    
                    {/* Features */}
                    <div className="border-t border-white/20 pt-4">
                      <p className="text-sm font-medium text-white mb-2">What's included:</p>
                      <ul className="space-y-2 text-left text-sm">
                        {tier.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span className="text-white/90">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </div>
                
                <CardFooter>
                  <Button 
                    className={cn(
                      "w-full rounded-lg text-base font-medium py-5 transition-all duration-300",
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
          onSuccess={() => handleCheckout()}
          selectedPackage={{
            name: selectedTier.name,
            submissions: selectedTier.submissions,
            price: selectedTier.price
          }}
        />
      )}
    </>
  );
};

export default PricingPlan;
