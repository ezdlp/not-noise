
import { CTAButton } from "@/components/ui/cta-button";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[85vh] flex items-center px-4 md:px-8 py-4 md:py-20 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6 md:gap-12 items-center">
        <div className="text-left relative z-10 order-1">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[72px] leading-tight font-bold mb-4 md:mb-6 font-heading text-night">
            Elevate Your Music With{" "}
            <span className="text-primary">Smart Links</span>
          </h1>
          <p className="text-base md:text-lg text-[#333333] mb-6 md:mb-8 max-w-xl leading-relaxed font-sans">
            Create powerful smart links that connect your fans to your music across all platforms. Built-in Meta Pixel integration and email capture to grow your audience faster.
          </p>
          <CTAButton 
            onClick={() => navigate("/create")}
            className="w-auto px-6 md:px-8 py-3 md:py-4 shadow-md transition-all duration-200"
          >
            Get Started For Free
          </CTAButton>
          <p className="mt-3 md:mt-4 text-sm text-gray-600 font-medium">Used by 10,000+ artists worldwide</p>
        </div>

        <div className="relative order-2 w-full h-[400px] sm:h-[500px] md:h-[700px] mt-12 md:mt-0">
          {/* Background with subtle grain texture */}
          <div 
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
            }}
          />
          
          {/* Smart Link Mockups Group */}
          <div className="relative w-full h-full">
            {/* Mobile Layout */}
            <div className="md:hidden relative h-full flex items-center justify-center">
              <div 
                className="absolute left-0 bottom-0 w-[45%] transform -rotate-6 z-10 transition-all duration-300"
                style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
              >
                <img
                  src="/lovable-uploads/1312b6ce-b7d7-473c-8627-3a0fdb32da04.png"
                  alt="Taylor Swift Smart Link"
                  className="w-full rounded-xl"
                />
              </div>
              
              <div 
                className="absolute w-[55%] transform translate-y-[-5%] z-20 transition-all duration-300"
                style={{ filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15))' }}
              >
                <img
                  src="/lovable-uploads/e709fc84-dd53-4a41-be18-f0a50ed7e297.png"
                  alt="Tyler Smart Link"
                  className="w-full rounded-xl"
                />
              </div>
              
              <div 
                className="absolute right-0 bottom-0 w-[45%] transform rotate-6 z-10 transition-all duration-300"
                style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
              >
                <img
                  src="/lovable-uploads/d852ef07-009f-4bf3-b033-645c174fb5d5.png"
                  alt="Olivia Rodrigo Smart Link"
                  className="w-full rounded-xl"
                />
              </div>
            </div>

            {/* Desktop Layout - Now matching mobile layout structure */}
            <div className="hidden md:flex items-center justify-center h-full relative">
              <div 
                className="absolute w-[45%] left-0 bottom-[10%] transform -rotate-6 z-10 transition-all duration-300 hover:scale-105"
                style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
              >
                <img
                  src="/lovable-uploads/1312b6ce-b7d7-473c-8627-3a0fdb32da04.png"
                  alt="Taylor Swift Smart Link"
                  className="w-full rounded-xl"
                />
              </div>
              
              <div 
                className="absolute w-[55%] transform translate-y-[-5%] z-20 transition-all duration-300 hover:scale-105"
                style={{ 
                  filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15))'
                }}
              >
                <img
                  src="/lovable-uploads/e709fc84-dd53-4a41-be18-f0a50ed7e297.png"
                  alt="Tyler Smart Link"
                  className="w-full rounded-xl"
                />
              </div>
              
              <div 
                className="absolute w-[45%] right-0 bottom-[10%] transform rotate-6 z-10 transition-all duration-300 hover:scale-105"
                style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
              >
                <img
                  src="/lovable-uploads/d852ef07-009f-4bf3-b033-645c174fb5d5.png"
                  alt="Olivia Rodrigo Smart Link"
                  className="w-full rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
