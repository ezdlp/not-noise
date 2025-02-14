
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[80vh] flex items-center">
      <div className="absolute inset-0 bg-[#6851fb]" />
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
        style={{
          backgroundImage: `url('/lovable-uploads/hero-gradient.svg')`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center center'
        }}
      />
      
      <div className="relative container mx-auto px-4 py-20">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
            Smart Links for{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-50">
              Music Marketing
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/90 mb-8 animate-fade-in [animation-delay:200ms]">
            Create beautiful landing pages for your music releases. Share one link everywhere.
            Track performance and grow your audience.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in [animation-delay:400ms]">
            <Button 
              onClick={() => navigate("/register")}
              size="lg"
              className="w-full sm:w-auto mx-auto sm:mx-0 bg-white hover:bg-white/90 text-primary px-8"
            >
              Get Started For Free
            </Button>
            
            <Button 
              variant="ghost" 
              size="lg"
              onClick={() => navigate("/features")}
              className="w-full sm:w-auto text-white hover:bg-white/10"
            >
              See All Features
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
