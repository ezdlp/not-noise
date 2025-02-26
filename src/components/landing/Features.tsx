
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { OptimizedImage } from "@/components/ui/optimized-image";

const Features = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-16 font-heading">Stand Out on Social Media</h2>
        <div className="grid md:grid-cols-2 gap-12 md:gap-16">
          {/* Social Media Assets Feature */}
          <div className="space-y-4 md:space-y-6">
            <h3 className="text-xl md:text-2xl font-semibold font-heading">Create Professional Social Media Assets</h3>
            <p className="text-gray-600">Generate branded social media assets in seconds. Perfect for Instagram, Facebook, TikTok, and X (formerly Twitter). Share your music everywhere, professionally.</p>
            <Button onClick={() => navigate("/register")} variant="outline" className="mt-4">
              Get Started
            </Button>
            <div className="relative mt-8">
              <OptimizedImage
                src="/lovable-uploads/7b845469-ae5d-4e0d-be6e-91b3cfa1808e.png"
                alt="Social Media Assets Preview"
                className="rounded-lg shadow-lg w-full"
                width={580}
                height={400}
                priority={true}
              />
            </div>
          </div>

          {/* Link in Bio Feature */}
          <div className="space-y-4 md:space-y-6">
            <h3 className="text-xl md:text-2xl font-semibold font-heading">Create Your Link in Bio</h3>
            <p className="text-gray-600">One link to rule them all. Share your music, merch, social profiles, and more. Custom domain support included.</p>
            <Button onClick={() => navigate("/register")} variant="outline" className="mt-4">
              Get Started
            </Button>
            <div className="relative mt-8">
              <OptimizedImage
                src="/lovable-uploads/56b25c3e-b9f6-40fe-a8db-39be68cb0cdb.png"
                alt="Link in Bio Preview"
                className="rounded-lg shadow-lg w-full"
                width={580}
                height={400}
                priority={true}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
