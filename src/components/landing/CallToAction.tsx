import { CTAButton } from "@/components/ui/cta-button";
import { useNavigate } from "react-router-dom";

export const CallToAction = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 whitespace-nowrap">
          Start Growing Your Music Career Today
        </h2>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Join thousands of artists using Soundraiser to promote their music smarter. Create your first Smart Link in less than 3 minutes - it's free.
        </p>
        <CTAButton 
          onClick={() => navigate("/create")}
        >
          Create Your Smart Link
        </CTAButton>
      </div>
    </section>
  );
};