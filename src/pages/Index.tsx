import { Hero } from "@/components/landing/Hero";
import { TrustedLabels } from "@/components/landing/TrustedLabels";
import { Features } from "@/components/landing/Features";
import { FAQ } from "@/components/landing/FAQ";
import { CallToAction } from "@/components/landing/CallToAction";
import { Footer } from "@/components/landing/Footer";
import { useEffect } from "react";
import { toast } from "sonner";

const Index = () => {
  useEffect(() => {
    const currentUrl = window.location.href;
    if (currentUrl.endsWith(':')) {
      const cleanUrl = currentUrl.slice(0, -1);
      window.history.replaceState({}, '', cleanUrl);
      toast.error("Invalid URL detected and fixed");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-accent/20">
      <Hero />
      <TrustedLabels />
      <Features />
      <FAQ />
      <CallToAction />
      <Footer />
    </div>
  );
};

export default Index;