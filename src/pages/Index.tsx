
import { Hero } from "@/components/landing/Hero";
import { TrustedLabels } from "@/components/landing/TrustedLabels";
import Features from "@/components/landing/Features";
import { FAQ } from "@/components/landing/FAQ";
import { CallToAction } from "@/components/landing/CallToAction";
import { Footer } from "@/components/landing/Footer";
import { useEffect } from "react";
import { toast } from "sonner";
import WebsiteSEO from "@/components/seo/WebsiteSEO";
import { Helmet } from "react-helmet";
import { useLocation } from "react-router-dom";

const Index = () => {
  const { pathname } = useLocation();
  
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

  // Only include SEO for the homepage, not for smart links or other pages
  const shouldIncludeSEO = pathname === "/";

  return (
    <div className="min-h-screen">
      {shouldIncludeSEO && <WebsiteSEO />}
      
      {shouldIncludeSEO && (
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify(breadcrumbSchema)}
          </script>
        </Helmet>
      )}
      
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
