import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const CallToAction = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Start Growing Your Music Career Today
        </h2>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Join thousands of artists using Soundraiser to promote their music smarter. Create your first Smart Link in less than 3 minutes - it's free.
        </p>
        <Button 
          size="lg" 
          className="button-gradient text-lg px-12 py-6 h-auto"
          onClick={() => navigate("/create")}
        >
          Create Your Smart Link
        </Button>
      </div>
    </section>
  );
};