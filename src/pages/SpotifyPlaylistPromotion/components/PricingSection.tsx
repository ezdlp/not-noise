
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
    if (!selectedTrack) {
      console.log('No track selected, redirecting back');
      navigate('..');
    }
  }, [selectedTrack, navigate]);

  const handlePromotionSubmit = (submissions: number, totalCost: number) => {
    console.log('Proceeding to checkout:', { submissions, totalCost });
  };

  if (!selectedTrack) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Base background color */}
      <div className="absolute inset-0 bg-[#6851fb]" />
      
      {/* Gradient overlay with texture */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/lovable-uploads/hero-gradient.svg')`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center center'
        }}
      />

      {/* Content */}
      <div className="relative container mx-auto px-4 py-12">
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
            Select the package that best fits your promotion needs. Each tier offers different levels of playlist submissions and expert consultation.
          </p>
        </div>

        <PricingPlan
          onSubmit={handlePromotionSubmit}
          selectedTrack={selectedTrack}
        />

        <div className="mt-16 text-center text-white/80">
          <h3 className="text-xl font-semibold text-white mb-4">What Happens Next?</h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div>
              <div className="text-2xl mb-2">1</div>
              <h4 className="font-semibold mb-2">Track Review</h4>
              <p className="text-sm">Our team analyzes your track and creates a custom promotion strategy</p>
            </div>
            <div>
              <div className="text-2xl mb-2">2</div>
              <h4 className="font-semibold mb-2">Playlist Outreach</h4>
              <p className="text-sm">We submit your track to carefully selected playlist curators</p>
            </div>
            <div>
              <div className="text-2xl mb-2">3</div>
              <h4 className="font-semibold mb-2">Results & Reports</h4>
              <p className="text-sm">Get detailed feedback and track your promotion progress</p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-block border border-white/20 rounded-lg px-6 py-4 text-white/80">
            <p className="text-sm font-medium">🎯 Limited spots available this month</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingSection;

