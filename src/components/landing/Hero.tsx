import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center px-4 py-20">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="text-left">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Elevate Your Music With{" "}
            <span className="bg-clip-text text-transparent gradient-primary">
              Smart Links
            </span>
            .
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-xl">
            Seamlessly connect your audience to your music across all major streaming platforms with just one click.
          </p>
          <Button 
            size="lg" 
            className="button-gradient"
            onClick={() => navigate("/create")}
          >
            Get Started For Free
          </Button>
        </div>
        <div className="relative">
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