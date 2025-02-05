
import { Hero } from "@/components/landing/Hero";
import { TrustedLabels } from "@/components/landing/TrustedLabels";
import Features from "@/components/landing/Features";
import { FAQ } from "@/components/landing/FAQ";
import { CallToAction } from "@/components/landing/CallToAction";
import { Footer } from "@/components/landing/Footer";
import { SuccessStories } from "@/components/landing/SuccessStories";
import { useEffect } from "react";
import { toast } from "sonner";

const Index = () => {
  useEffect(() => {
    // Remove any trailing colons from URLs
    const currentUrl = window.location.href;
    if (currentUrl.endsWith(':')) {
      const cleanUrl = currentUrl.slice(0, -1);
      window.history.replaceState({}, '', cleanUrl);
      toast.error("Invalid URL detected and fixed");
    }
  }, []);

  return (
    <div className="min-h-screen">
      <Hero />
      <TrustedLabels />
      <Features />
      <SuccessStories />
      <FAQ />
      <CallToAction />
      <Footer />
    </div>
  );
};

export default Index;
