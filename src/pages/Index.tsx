import { Hero } from "@/components/landing/Hero";
import { TrustedLabels } from "@/components/landing/TrustedLabels";
import { Features } from "@/components/landing/Features";
import { FAQ } from "@/components/landing/FAQ";
import { CallToAction } from "@/components/landing/CallToAction";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
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