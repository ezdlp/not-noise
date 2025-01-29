import { CTAButton } from "@/components/ui/cta-button";
import { useNavigate } from "react-router-dom";

export const CallToAction = () => {
  const navigate = useNavigate();

  return (
    <section className="py-48 px-4 bg-white">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-night font-heading whitespace-nowrap">
          Start Growing Your Music Career Today
        </h2>
        <p className="text-[16px] text-[#333333] mb-10 max-w-2xl mx-auto font-sans">
          Join thousands of artists using Soundraiser to promote their music smarter. Create your first Smart Link in less than 3 minutes - it's free.
        </p>
        <CTAButton 
          onClick={() => navigate("/create")}
          className="px-8 py-4 shadow-md hover:bg-primary-hover hover:scale-[1.02] transition-all duration-200"
        >
          Create Your Smart Link
        </CTAButton>
      </div>
    </section>
  );
};