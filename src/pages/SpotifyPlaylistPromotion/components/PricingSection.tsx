
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import PricingPlan from "@/components/spotify-promotion/PricingPlan";
import { ChevronLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

interface LocationState {
  selectedTrack?: {
    title: string;
    artist: string;
    artworkUrl?: string;
  };
}

const PricingSection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedTrack } = (location.state as LocationState) || {};

  useEffect(() => {
    // If no track is selected, redirect back to track selection
    if (!selectedTrack) {
      console.log('No track selected, redirecting back');
      navigate('..');
    }
  }, [selectedTrack, navigate]);

  const handlePromotionSubmit = (submissions: number, totalCost: number) => {
    // Handle the checkout process here
    console.log('Proceeding to checkout:', { submissions, totalCost });
  };

  if (!selectedTrack) {
    return null; // Prevent flash of content while redirecting
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F0F0F] to-background pb-20">
      <div className="container mx-auto px-4 py-12">
        <Button
          variant="ghost"
          className="text-white mb-8 hover:text-white/80"
          onClick={() => navigate('..')}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Track Selection
        </Button>

        {selectedTrack && (
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-4">
              {selectedTrack.artworkUrl && (
                <img
                  src={selectedTrack.artworkUrl}
                  alt={selectedTrack.title}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedTrack.title}</h2>
                <p className="text-white/60">{selectedTrack.artist}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Choose Your Promotion Package
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Select the package that best fits your promotion needs. Each tier offers different levels of playlist submissions and expected performance.
          </p>
        </div>

        <PricingPlan
          onSubmit={handlePromotionSubmit}
          selectedTrack={selectedTrack}
        />
      </div>
    </div>
  );
};

export default PricingSection;

