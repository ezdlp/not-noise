import { CTAButton } from "@/components/ui/cta-button";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[85vh] flex items-center px-4 md:px-8 py-20 bg-white">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="text-left">
          <h1 className="text-3xl md:text-[36px] font-bold mb-6 font-heading text-night">
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
            className="w-full md:w-auto px-8 py-4 shadow-md hover:bg-primary-hover hover:scale-[1.02] transition-all duration-200"
          >
            Get Started For Free
          </CTAButton>
        </div>
        <div className="relative order-first md:order-last">
          <div className="relative w-full aspect-square bg-primary-light rounded-xl shadow-sm p-4">
            <img
              src="/lovable-uploads/home/Hero.png"
              alt="Smart Link Preview"
              className="w-full h-full object-contain animate-float shadow-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};