
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Award, CheckCircle2, Crown, Shield } from "lucide-react";
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
  icon: React.ReactNode;
  submissions: number;
  minAdds: number;
  maxAdds: number;
  price: number;
  discount: number;
  popular?: boolean;
  features: string[];
}

const PricingPlan: React.FC<PricingPlanProps> = ({ onSubmit, selectedTrack }) => {
  const tiers: PricingTier[] = [
    {
      name: "Silver",
      icon: <Shield className="h-8 w-8 text-slate-500" />,
      submissions: 20,
      minAdds: 4,
      maxAdds: 5,
      price: 220,
      discount: 0,
      features: [
        "Playlist Curator Feedback",
        "Track Performance Analytics",
        "Support via Email"
      ]
    },
    {
      name: "Gold",
      icon: <Crown className="h-8 w-8 text-amber-400" />,
      submissions: 35,
      minAdds: 7,
      maxAdds: 8,
      price: 385,
      discount: 5,
      popular: true,
      features: [
        "Playlist Curator Feedback",
        "Track Performance Analytics",
        "Priority Support via Email",
        "Personalized Promotion Strategy",
        "Monthly Performance Report"
      ]
    },
    {
      name: "Platinum",
      icon: <Award className="h-8 w-8 text-primary" />,
      submissions: 50,
      minAdds: 11,
      maxAdds: 12,
      price: 500,
      discount: 10,
      features: [
        "Playlist Curator Feedback",
        "Track Performance Analytics",
        "24/7 Priority Support",
        "Personalized Promotion Strategy",
        "Weekly Performance Reports",
        "Dedicated Campaign Manager"
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
      {selectedTrack && (
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold">{selectedTrack.title}</h3>
          <p className="text-muted-foreground">{selectedTrack.artist}</p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((tier) => {
          const metrics = calculateMetrics(tier);
          return (
            <Card 
              key={tier.name}
              className={cn(
                "relative",
                tier.popular && "border-primary shadow-lg scale-105"
              )}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-0 right-0 mx-auto w-fit px-4 py-1 bg-primary text-white text-sm rounded-full">
                  Most Popular
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  {tier.icon}
                  <div className="text-right">
                    <p className="text-2xl font-bold">${tier.price}</p>
                    {tier.discount > 0 && (
                      <p className="text-sm text-emerald-600">Save ${metrics.savings}</p>
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-bold">{tier.name} Package</h3>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Playlist Submissions</span>
                    <span className="font-semibold">{tier.submissions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Expected Playlist Adds</span>
                    <span className="font-semibold">{tier.minAdds}-{tier.maxAdds}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Expected Streams</span>
                    <span className="font-semibold">{metrics.streams}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                <Button 
                  onClick={() => handleSelect(tier)}
                  className={cn(
                    "w-full",
                    tier.popular ? "bg-primary hover:bg-primary/90" : ""
                  )}
                >
                  Select {tier.name} Package
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        * Expected playlist adds and streams are estimates based on historical data
      </p>
    </div>
  );
};

export default PricingPlan;
