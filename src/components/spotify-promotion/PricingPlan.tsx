
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PricingPlanProps {
  onSubmit?: (submissions: number, totalCost: number) => void;
  selectedTrack?: {
    title: string;
    artist: string;
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
}

const PricingPlan: React.FC<PricingPlanProps> = ({ onSubmit }) => {
  const tiers: PricingTier[] = [
    {
      name: "Silver",
      submissions: 20,
      minAdds: 4,
      maxAdds: 5,
      price: 220,
      discount: 0,
      vinylImage: "/lovable-uploads/430f856f-d860-4675-9520-bd9e1742c166.png",
      features: [
        "Basic A&R & Production Feedback",
        "Support via Email",
        "Basic Target Audience Analysis",
        "Playlist Curator Feedback"
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
      features: [
        "Detailed A&R & Production Consultation",
        "Priority Support via Email",
        "Comprehensive Target Audience Analysis",
        "Playlist Curator Feedback",
        "Song Structure Analysis",
        "Release Strategy Planning"
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
      features: [
        "Extensive A&R & Production Development Plan",
        "24/7 Priority Support",
        "In-depth Target Audience Analysis",
        "Playlist Curator Feedback",
        "Song Structure Analysis",
        "Release Strategy Planning",
        "Sound Design Consultation",
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
      savings: savings.toFixed(2)
    };
  };

  const handleSelect = (tier: PricingTier) => {
    if (onSubmit) {
      onSubmit(tier.submissions, tier.price);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((tier) => {
          const metrics = calculateMetrics(tier);
          return (
            <Card 
              key={tier.name}
              className={cn(
                "relative flex flex-col justify-between group bg-[#FAFAFA] backdrop-blur-sm border-white/20 shadow-xl transition-all duration-300",
                tier.popular && "md:scale-105 border-primary shadow-2xl"
              )}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-0 right-0 mx-auto w-fit px-4 py-1 bg-primary text-white text-sm rounded-full">
                  Most Popular
                </div>
              )}
              
              <div>
                <CardHeader className="text-center pb-4">
                  <div className="relative w-32 h-32 mx-auto mb-6 group-hover:scale-105 transition-transform duration-300">
                    <img 
                      src={tier.vinylImage}
                      alt={`${tier.name} vinyl`}
                      className="w-full h-full"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-[#0F0F0F]">{tier.name} Package</h3>
                  <div className="mt-2">
                    <p className="text-3xl font-bold text-[#0F0F0F]">${tier.price}</p>
                    {tier.discount > 0 && (
                      <p className="text-sm text-emerald-400">Save ${metrics.savings}</p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-[#0F0F0F]/80">
                      <span>Playlist Submissions</span>
                      <span className="font-semibold">{tier.submissions}</span>
                    </div>
                    <div className="flex justify-between text-sm text-[#0F0F0F]/80">
                      <span>Expected Playlist Adds</span>
                      <span className="font-semibold">{tier.minAdds}-{tier.maxAdds}</span>
                    </div>
                    <div className="flex justify-between text-sm text-[#0F0F0F]/80">
                      <span>Expected Streams</span>
                      <span className="font-semibold">{metrics.streams}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {tier.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-[#0F0F0F]/80">
                        <svg className="h-4 w-4 text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </div>

              <CardFooter className="mt-6">
                <Button 
                  onClick={() => handleSelect(tier)}
                  className={cn(
                    "w-full transition-colors duration-300",
                    tier.popular ? "bg-primary hover:bg-primary/90" : "bg-white/10 hover:bg-white/20"
                  )}
                >
                  Select {tier.name} Package
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 mt-8">
        <div className="flex items-center justify-center gap-2 text-[#0F0F0F]/80">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <span className="text-sm">100% Money-back Guarantee</span>
        </div>
      </div>

      <p className="text-sm text-[#0F0F0F]/60 text-center">
        * Expected playlist adds and streams are estimates based on historical data
      </p>
    </div>
  );
};

export default PricingPlan;
