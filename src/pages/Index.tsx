
import { Hero } from "@/components/landing/Hero";
import { TrustedLabels } from "@/components/landing/TrustedLabels";
import Features from "@/components/landing/Features";
import { FAQ } from "@/components/landing/FAQ";
import { CallToAction } from "@/components/landing/CallToAction";
import { Footer } from "@/components/landing/Footer";
import { useEffect } from "react";
import { toast } from "sonner";
import { DefaultSEO } from "@/components/seo/DefaultSEO";
import WebsiteSEO from "@/components/seo/WebsiteSEO";
import { Helmet } from "react-helmet";

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

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [{
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://soundraiser.io"
    }]
  };

  return (
    <div className="min-h-screen">
      <DefaultSEO />
      <WebsiteSEO />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>
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
