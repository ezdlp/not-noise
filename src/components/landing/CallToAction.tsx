import { CTAButton } from "@/components/ui/cta-button";
import { useNavigate } from "react-router-dom";

export const CallToAction = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4 bg-cta-gradient">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white font-heading whitespace-nowrap">
          Start Growing Your Music Career Today
        </h2>
        <p className="text-xl text-moonRaker mb-10 max-w-2xl mx-auto">
          Join thousands of artists using Soundraiser to promote their music smarter. Create your first Smart Link in less than 3 minutes - it's free.
        </p>
        <CTAButton 
          onClick={() => navigate("/create")}
          className="bg-cornflower text-white hover:scale-105 transition-transform duration-300 hover:animate-glow"
        >
          Create Your Smart Link
        </CTAButton>
      </div>
    </section>
  );
};