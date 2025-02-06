
import React from "react";
import { CalculatorHero } from "./components/CalculatorHero";
import { CalculatorForm } from "./components/CalculatorForm";
import { PlatformResults } from "./components/PlatformResults";
import { RoyaltyChart } from "./components/RoyaltyChart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const StreamingCalculator = () => {
  const { toast } = useToast();
  const [count, setCount] = React.useState<number>(0);
  const [calculationType, setCalculationType] = React.useState<"streams" | "monthlyListeners">("streams");

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'Music Streaming Royalty Calculator Results',
        text: `Check out my streaming calculation for ${count.toLocaleString()} ${calculationType}!`,
        url: window.location.href
      });
    } catch (err) {
      toast({
        title: "Copied to clipboard!",
        description: "You can now share your calculation results.",
      });
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-[#6851fb] via-[#FE28A2] to-[#37D299] overflow-hidden">
      {/* Gradient overlay with noise texture */}
      <div className="absolute inset-0 bg-[url('/lovable-uploads/hero-gradient.svg')] opacity-50 mix-blend-overlay" />
      
      <div className="relative">
        <CalculatorHero />
        
        <div className="container mx-auto px-4 py-12 space-y-8">
          <Card className="backdrop-blur-xl bg-white/90 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-8">
            <CalculatorForm 
              count={count}
              setCount={setCount}
              calculationType={calculationType}
              setCalculationType={setCalculationType}
            />

            {count > 0 && (
              <div className="space-y-8 animate-fade-in mt-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Your Estimated Earnings</h2>
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Results
                  </Button>
                </div>
                
                <PlatformResults 
                  count={count}
                  calculationType={calculationType}
                />
                
                <RoyaltyChart 
                  count={count}
                  calculationType={calculationType}
                />
              </div>
            )}
          </Card>
          
          <p className="text-white/80 text-center text-sm md:text-base max-w-2xl mx-auto">
            These calculations are estimates based on average rates. Actual earnings may vary as streaming platforms use complex formulas that consider factors like subscription type, geographic location, and total platform revenue rather than a fixed per-stream rate.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StreamingCalculator;
