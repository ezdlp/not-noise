import { CTAButton } from "@/components/ui/cta-button";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[85vh] flex items-center px-4 md:px-8 py-20 bg-hero-gradient">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="text-left">
          <h1 className="text-3xl md:text-6xl font-bold mb-6 font-heading text-white">
            Elevate Your Music With{" "}
            <span className="text-vibrantYellow">
              Smart Links
            </span>
          </h1>
          <p className="text-lg md:text-xl text-softLavender mb-8 max-w-xl leading-relaxed">
            Create powerful smart links that connect your fans to your music across all platforms. Built-in Meta Pixel integration and email capture to grow your audience faster.
          </p>
          <CTAButton 
            onClick={() => navigate("/create")}
            className="bg-neonGreen text-onyx hover:bg-white transition-all duration-300 transform hover:scale-105 hover:animate-glow font-bold"
          >
            Get Started For Free
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