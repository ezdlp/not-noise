import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const CallToAction = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Create Free Music Smart Links
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Setup your music smart link in less than 3 minutes. It's 100% free, no credit card required.
        </p>
        <Button 
          size="lg" 
          className="button-gradient"
          onClick={() => navigate("/create")}
        >
          Get Started Now
        </Button>
      </div>
    </section>
  );
};