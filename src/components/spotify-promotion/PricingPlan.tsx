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

    // Store the selected tier and show signup modal
    setSelectedTier(tier);
    setShowSignupModal(true);
  };

  const handleCheckout = async () => {
    if (!selectedTier || !selectedTrack) return;

    try {
      const { data: { session_url }, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: selectedTier.priceId,
          promotionData: {
            trackName: selectedTrack.title,
            trackArtist: selectedTrack.artist,
            spotifyTrackId: selectedTrack.id,
            spotifyArtistId: selectedTrack.artistId,
            submissionCount: selectedTier.submissions,
            estimatedAdditions: selectedTier.maxAdds,
            genre: selectedTrack.genre || 'other'
          }
        }
      });

      if (error) throw error;
      
      // Redirect to Stripe Checkout
      window.location.href = session_url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "There was an error processing your request. Please try again.",
        variant: "destructive"
      });
    }

    if (onSubmit) {
      onSubmit(selectedTier.submissions, selectedTier.price);
    }
  };

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
                  "relative flex flex-col justify-between group bg-[#FAFAFA] backdrop-blur-sm transition-all duration-300 hover:shadow-xl",
                  tier.popular && "md:scale-105 border-primary"
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
                        className="w-full h-full animate-float"
                      />
                    </div>
                    <h3 className="text-2xl font-bold text-[#0F0F0F]">{tier.name} Package</h3>
                    <div className="mt-2 space-y-1">
                      {tier.discount > 0 ? (
                        <>
                          <p className="text-sm text-[#0F0F0F]/60 line-through">${metrics.originalPrice}</p>
                          <p className="text-3xl font-bold text-[#0F0F0F]">${tier.price}</p>
                          <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-sm rounded-full">
                            Save ${metrics.savings}
                          </span>
                        </>
                      ) : (
                        <p className="text-3xl font-bold text-[#0F0F0F]">${tier.price}</p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="p-4 bg-white rounded-lg space-y-2 shadow-sm">
                      <div className="flex justify-between text-sm text-[#0F0F0F]/80">
                        <span>Playlist Submissions</span>
                        <span className="font-semibold">{tier.submissions}</span>
                      </div>
                      <div className="flex justify-between text-sm text-[#0F0F0F]/80">
                        <span className="flex items-center gap-1">
                          Expected Playlist Adds
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-[#0F0F0F]/40" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-[200px] text-xs">
                                Based on historical data and campaign performance
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </span>
                        <span className="font-semibold">{tier.minAdds}-{tier.maxAdds}</span>
                      </div>
                      <div className="flex justify-between text-sm text-[#0F0F0F]/80">
                        <span>Expected Streams</span>
                        <span className="font-semibold">{metrics.streams}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {tier.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm text-[#0F0F0F]/80 group/feature">
                          <svg 
                            className="h-4 w-4 text-emerald-400 flex-shrink-0 transition-transform duration-300 group-hover/feature:scale-110" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          <span className="group-hover/feature:text-[#0F0F0F]">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="mt-6">
                  <Button 
                    onClick={() => handleSelect(tier)}
                    className={cn(
                      "w-full transition-all duration-300 hover:scale-105",
                      tier.popular ? 
                        "bg-primary hover:bg-primary/90 text-white" : 
                        "bg-[#0F0F0F] hover:bg-[#0F0F0F]/90 text-white"
                    )}
                  >
                    Get Started with {tier.name}
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

      {selectedTier && (
        <PromotionSignupModal
          isOpen={showSignupModal}
          onClose={() => setShowSignupModal(false)}
          onSuccess={handleCheckout}
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
