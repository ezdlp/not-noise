import { CTAButton } from "@/components/ui/cta-button";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[85vh] flex items-center px-4 md:px-8 py-20">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="text-left space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Elevate Your Music With{" "}
            <span className="block mt-2">
              Smart Links
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-xl leading-relaxed">
            Create powerful smart links that connect your fans to your music across all platforms. Built-in Meta Pixel integration and email capture to grow your audience faster.
          </p>
          <CTAButton 
            onClick={() => navigate("/create")}
            className="w-full md:w-auto shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            Get Started For Free
          </CTAButton>
        </div>
        <div className="relative order-first md:order-last">
          <div className="relative w-full aspect-square">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-3xl -z-10" />
            <img
              src="/lovable-uploads/home/Hero.png"
              alt="Smart Link Preview"
              className="w-full h-full object-contain animate-float drop-shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
};