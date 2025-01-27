import { CTAButton } from "@/components/ui/cta-button";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[85vh] flex items-center px-4 md:px-8 py-20 bg-hero-gradient relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-secondary rounded-full mix-blend-multiply filter blur-xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent rounded-full mix-blend-multiply filter blur-xl animate-float delay-200"></div>
      </div>
      
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center relative">
        <div className="text-left">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 font-heading">
            Elevate Your Music With{" "}
            <span className="text-secondary drop-shadow-lg">
              Smart Links
            </span>
          </h1>
          <p className="text-lg md:text-xl text-onyx mb-8 max-w-xl leading-relaxed font-sans">
            Create powerful smart links that connect your fans to your music across all platforms. Built-in Meta Pixel integration and email capture to grow your audience faster.
          </p>
          <CTAButton 
            onClick={() => navigate("/create")}
            className="w-full md:w-auto font-heading uppercase tracking-wider bg-accent hover:bg-accent/90 hover:animate-bounce"
          >
            No cap, it's free 🎶
          </CTAButton>
        </div>
        <div className="relative order-first md:order-last">
          <div className="relative w-full aspect-square">
            <img
              src="/lovable-uploads/home/Hero.png"
              alt="Smart Link Preview"
              className="w-full h-full object-contain animate-float"
            />
          </div>
        </div>
      </div>
    </div>
  );
};