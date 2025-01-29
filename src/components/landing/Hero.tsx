import { CTAButton } from "@/components/ui/cta-button";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[85vh] flex items-center px-4 md:px-8 py-12 md:py-20 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div className="text-left relative z-10 order-2 md:order-1">
          <h1 className="text-4xl sm:text-5xl md:text-[72px] leading-tight font-bold mb-4 md:mb-6 font-heading text-night">
            Elevate Your Music With{" "}
            <span className="text-primary">
              Smart Links
            </span>
          </h1>
          <p className="text-base md:text-lg text-[#333333] mb-6 md:mb-8 max-w-xl leading-relaxed font-sans">
            Create powerful smart links that connect your fans to your music across all platforms. Built-in Meta Pixel integration and email capture to grow your audience faster.
          </p>
          <CTAButton 
            onClick={() => navigate("/create")}
            className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 shadow-md transition-all duration-200"
          >
            Get Started For Free
          </CTAButton>
          <p className="mt-3 md:mt-4 text-sm text-gray-600 font-medium">Used by 10,000+ artists worldwide</p>
        </div>
        <div className="relative order-1 md:order-2 h-[300px] md:h-[600px] -mt-4 md:mt-0">
          {/* Background with subtle grain texture */}
          <div 
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
          
          {/* Decorative squares with Majorelle Blue gradients */}
          <div 
            className="absolute top-1/2 left-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] border-2 rounded-none"
            style={{ 
              borderImage: 'linear-gradient(45deg, rgba(104, 81, 251, 0.3), rgba(74, 71, 165, 0.5)) 1',
              transform: 'translate(-60%, -50%) rotate(-12deg)',
              animation: 'rotate 20s linear infinite',
            }}
          />
          
          {/* Second decorative square */}
          <div 
            className="absolute top-1/2 left-1/2 w-[250px] md:w-[400px] h-[250px] md:h-[400px] border-2 rounded-none"
            style={{ 
              borderImage: 'linear-gradient(45deg, rgba(104, 81, 251, 0.3), rgba(74, 71, 165, 0.5)) 1',
              transform: 'translate(-20%, -50%) rotate(12deg)',
              animation: 'rotate 15s linear infinite reverse',
            }}
          />
          
          {/* Smart Link Mockups Group */}
          <div 
            className="relative w-full h-full group transition-all duration-500 ease-in-out hover:-translate-y-4"
          >
            {/* Taylor Swift Mockup */}
            <div 
              className="absolute top-1/2 left-1/2 w-[200px] md:w-[300px] transform -translate-x-[80%] -translate-y-[60%] -rotate-6 transition-all duration-300"
              style={{
                animation: 'float 6s ease-in-out infinite',
                boxShadow: '0 2px 4px rgba(15, 15, 15, 0.1)'
              }}
            >
              <img
                src="/lovable-uploads/1312b6ce-b7d7-473c-8627-3a0fdb32da04.png"
                alt="Taylor Swift Smart Link"
                className="w-full rounded-xl"
              />
            </div>
            
            {/* Olivia Rodrigo Mockup */}
            <div 
              className="absolute top-1/2 left-1/2 w-[200px] md:w-[300px] transform -translate-x-[50%] -translate-y-[50%] rotate-3 transition-all duration-300"
              style={{
                animation: 'float 6s ease-in-out infinite',
                animationDelay: '2s',
                boxShadow: '0 2px 4px rgba(15, 15, 15, 0.1)'
              }}
            >
              <img
                src="/lovable-uploads/d852ef07-009f-4bf3-b033-645c174fb5d5.png"
                alt="Olivia Rodrigo Smart Link"
                className="w-full rounded-xl"
              />
            </div>
            
            {/* Tyler Mockup */}
            <div 
              className="absolute top-1/2 left-1/2 w-[200px] md:w-[300px] transform -translate-x-[20%] -translate-y-[40%] rotate-12 transition-all duration-300"
              style={{
                animation: 'float 6s ease-in-out infinite',
                animationDelay: '4s',
                boxShadow: '0 2px 4px rgba(15, 15, 15, 0.1)'
              }}
            >
              <img
                src="/lovable-uploads/e709fc84-dd53-4a41-be18-f0a50ed7e297.png"
                alt="Tyler Smart Link"
                className="w-full rounded-xl"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};