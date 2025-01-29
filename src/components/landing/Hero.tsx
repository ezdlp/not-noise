import { CTAButton } from "@/components/ui/cta-button";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[85vh] flex items-center px-4 md:px-8 py-20 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="text-left relative z-10">
          <h1 className="text-5xl md:text-[64px] leading-tight font-bold mb-6 font-heading text-night">
            Elevate Your Music With{" "}
            <span className="text-primary">
              Smart Links
            </span>
          </h1>
          <p className="text-lg md:text-[18px] text-[#333333] mb-8 max-w-xl leading-relaxed font-sans">
            Create powerful smart links that connect your fans to your music across all platforms. Built-in Meta Pixel integration and email capture to grow your audience faster.
          </p>
          <CTAButton 
            onClick={() => navigate("/create")}
            className="w-full md:w-auto px-8 py-4 shadow-md transition-all duration-200"
          >
            Get Started For Free
          </CTAButton>
        </div>
        <div className="relative order-first md:order-last">
          {/* Decorative circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl"></div>
          
          {/* Smart Link Mockups */}
          <div className="relative w-full h-[600px]">
            {/* Taylor Swift Mockup */}
            <div className="absolute top-0 left-0 w-[300px] transform -rotate-6 hover:rotate-0 transition-all duration-500 hover:z-10 animate-float">
              <img
                src="/lovable-uploads/1312b6ce-b7d7-473c-8627-3a0fdb32da04.png"
                alt="Taylor Swift Smart Link"
                className="w-full rounded-xl shadow-lg hover:shadow-xl transition-all duration-500"
              />
            </div>
            
            {/* Olivia Rodrigo Mockup */}
            <div className="absolute top-10 left-20 w-[300px] transform rotate-3 hover:rotate-0 transition-all duration-500 hover:z-10 animate-float" style={{ animationDelay: '2s' }}>
              <img
                src="/lovable-uploads/d852ef07-009f-4bf3-b033-645c174fb5d5.png"
                alt="Olivia Rodrigo Smart Link"
                className="w-full rounded-xl shadow-lg hover:shadow-xl transition-all duration-500"
              />
            </div>
            
            {/* Tyler Mockup */}
            <div className="absolute top-20 left-40 w-[300px] transform rotate-12 hover:rotate-0 transition-all duration-500 hover:z-10 animate-float" style={{ animationDelay: '4s' }}>
              <img
                src="/lovable-uploads/e709fc84-dd53-4a41-be18-f0a50ed7e297.png"
                alt="Tyler Smart Link"
                className="w-full rounded-xl shadow-lg hover:shadow-xl transition-all duration-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};