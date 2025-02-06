
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import PricingPlan from "@/components/spotify-promotion/PricingPlan";
import { ChevronLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface LocationState {
  selectedTrack?: {
    title: string;
    artist: string;
    id: string;
    artistId: string;
    genre?: string;
    artworkUrl?: string;
  };
}

const PricingSection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { selectedTrack } = (location.state as LocationState) || {};

  useEffect(() => {
    if (!selectedTrack?.title || !selectedTrack?.artist) {
      toast({
        title: "No track selected",
        description: "Please select a track first",
        variant: "destructive",
      });
      navigate('..', { replace: true });
    }
  }, [selectedTrack, navigate, toast]);

  const handlePromotionSubmit = (submissions: number, totalCost: number) => {
    console.log('Proceeding to checkout:', { submissions, totalCost });
  };

  // Show loading state while checking track data
  if (!selectedTrack?.title || !selectedTrack?.artist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Redirecting to track selection...</p>
        </div>
      </div>
    );
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

        {/* Integrated Header Section */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center justify-center space-y-6">
            {selectedTrack.artworkUrl && (
              <div className="relative w-24 h-24 md:w-32 md:h-32">
                <img
                  src={selectedTrack.artworkUrl}
                  alt={selectedTrack.title}
                  className="w-full h-full object-cover rounded-lg shadow-lg"
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            )}
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Promotion Packages for
              </h1>
              <p className="text-2xl md:text-3xl font-bold text-white/90">
                "{selectedTrack.title}"
              </p>
              <p className="text-xl text-white/80">
                by {selectedTrack.artist}
              </p>
            </div>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mt-4">
              Custom-tailored promotion packages to get "{selectedTrack.title}" to the right audience 
              and boost your music career.
            </p>
          </div>
        </div>

        {/* Visual connector element */}
        <div className="flex justify-center mb-12">
          <div className="w-px h-12 bg-gradient-to-b from-white/20 to-transparent" />
        </div>

        <PricingPlan
          onSubmit={handlePromotionSubmit}
          selectedTrack={selectedTrack}
        />

        <div className="mt-16 text-center text-white/80">
          <h3 className="text-xl font-semibold text-white mb-4">What Happens Next?</h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="backdrop-blur-sm bg-white/5 rounded-lg p-6 transition-all duration-300 hover:bg-white/10">
              <div className="text-2xl mb-2">1</div>
              <h4 className="font-semibold mb-2">Track Review</h4>
              <p className="text-sm">Our team analyzes your track and creates a custom promotion strategy</p>
            </div>
            <div className="backdrop-blur-sm bg-white/5 rounded-lg p-6 transition-all duration-300 hover:bg-white/10">
              <div className="text-2xl mb-2">2</div>
              <h4 className="font-semibold mb-2">Playlist Outreach</h4>
              <p className="text-sm">We submit your track to carefully selected playlist curators</p>
            </div>
            <div className="backdrop-blur-sm bg-white/5 rounded-lg p-6 transition-all duration-300 hover:bg-white/10">
              <div className="text-2xl mb-2">3</div>
              <h4 className="font-semibold mb-2">Results & Reports</h4>
              <p className="text-sm">Get detailed feedback and track your promotion progress</p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-block backdrop-blur-sm bg-white/5 rounded-lg px-6 py-4 text-white/80">
            <p className="text-sm font-medium">🎯 Limited spots available this month</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingSection;
