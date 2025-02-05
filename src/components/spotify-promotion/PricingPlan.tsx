
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

const VinylIcon = ({ color, glowColor }: { color: string; glowColor: string }) => (
  <div className="relative w-32 h-32 mx-auto mb-6">
    {/* Glow effect */}
    <div 
      className="absolute inset-0 rounded-full blur-lg opacity-50 transition-opacity duration-300 group-hover:opacity-75"
      style={{ backgroundColor: glowColor }}
    />
    {/* Vinyl SVG with layered structure */}
    <svg 
      viewBox="0 0 128 128" 
      className="relative w-full h-full transition-transform duration-300 group-hover:scale-105"
    >
      {/* Frame */}
      <circle cx="64" cy="64" r="64" fill="#0F0F0F"/>
      {/* Background */}
      <circle cx="64" cy="64" r="60" fill="#BBBBBB"/>
      {/* Outer Ring */}
      <circle cx="64" cy="64" r="58" fill="#FFFFFF"/>
      {/* Vinyl Color */}
      <circle cx="64" cy="64" r="56" fill={color}/>
      {/* Center Hole */}
      <circle cx="64" cy="64" r="4" fill="#0F0F0F"/>
      {/* Grooves */}
      {[48, 40, 32, 24, 16].map((radius, index) => (
        <circle 
          key={index}
          cx="64" 
          cy="64" 
          r={radius} 
          fill="none" 
          stroke="#0F0F0F" 
          strokeWidth="0.5" 
          strokeOpacity="0.2"
        />
      ))}
    </svg>
  </div>
);

interface PricingTier {
  name: string;
  submissions: number;
  minAdds: number;
  maxAdds: number;
  price: number;
  discount: number;
  popular?: boolean;
  features: string[];
  vinylColor: string;
  glowColor: string;
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
      vinylColor: "#7D7D7D",
      glowColor: "#9F9EA1",
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
      vinylColor: "#FFD700",
      glowColor: "#FEC6A1",
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
      vinylColor: "#3636D1",
      glowColor: "#F1F1F1",
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
                "relative flex flex-col justify-between group backdrop-blur-sm bg-white/10 border-white/20 shadow-xl transition-all duration-300",
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
                  <VinylIcon color={tier.vinylColor} glowColor={tier.glowColor} />
                  <h3 className="text-2xl font-bold text-white">{tier.name} Package</h3>
                  <div className="mt-2">
                    <p className="text-3xl font-bold text-white">${tier.price}</p>
                    {tier.discount > 0 && (
                      <p className="text-sm text-emerald-400">Save ${metrics.savings}</p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-white/80">
                      <span>Playlist Submissions</span>
                      <span className="font-semibold">{tier.submissions}</span>
                    </div>
                    <div className="flex justify-between text-sm text-white/80">
                      <span>Expected Playlist Adds</span>
                      <span className="font-semibold">{tier.minAdds}-{tier.maxAdds}</span>
                    </div>
                    <div className="flex justify-between text-sm text-white/80">
                      <span>Expected Streams</span>
                      <span className="font-semibold">{metrics.streams}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {tier.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-white/80">
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
        <div className="flex items-center justify-center gap-2 text-white/80">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <span className="text-sm">100% Money-back Guarantee</span>
        </div>
      </div>

      <p className="text-sm text-white/60 text-center">
        * Expected playlist adds and streams are estimates based on historical data
      </p>
    </div>
  );
};

export default PricingPlan;

