
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
  const [streamCount, setStreamCount] = React.useState<number>(0);
  const [timeframe, setTimeframe] = React.useState<"monthly" | "yearly">("monthly");

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'Music Streaming Royalty Calculator Results',
        text: `Check out my streaming revenue calculation for ${streamCount.toLocaleString()} streams!`,
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
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <CalculatorHero />
      
      <div className="container mx-auto px-4 py-12 space-y-8">
        <Card className="p-6 backdrop-blur-sm bg-white/50">
          <CalculatorForm 
            streamCount={streamCount}
            setStreamCount={setStreamCount}
            timeframe={timeframe}
            setTimeframe={setTimeframe}
          />
        </Card>

        {streamCount > 0 && (
          <div className="space-y-8 animate-fade-in">
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
              streamCount={streamCount}
              timeframe={timeframe}
            />
            
            <RoyaltyChart 
              streamCount={streamCount}
              timeframe={timeframe}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamingCalculator;
