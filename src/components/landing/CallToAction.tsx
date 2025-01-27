import { CTAButton } from "@/components/ui/cta-button";
import { useNavigate } from "react-router-dom";

export const CallToAction = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4 bg-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full mix-blend-multiply filter blur-xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-secondary rounded-full mix-blend-multiply filter blur-xl animate-float delay-200"></div>
      </div>
      
      <div className="max-w-5xl mx-auto text-center relative">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 font-heading text-onyx">
          Start Growing Your Music Career Today
        </h2>
        <p className="text-xl text-onyx/80 mb-10 max-w-2xl mx-auto">
          Join thousands of artists using Soundraiser to promote their music smarter. Create your first Smart Link in less than 3 minutes - it's free.
        </p>
        <CTAButton 
          onClick={() => navigate("/create")}
          className="font-heading uppercase tracking-wider bg-secondary hover:bg-secondary/90 hover:animate-glitch"
        >
          Create Your Smart Link
        </CTAButton>
      </div>
    </section>
  );
};