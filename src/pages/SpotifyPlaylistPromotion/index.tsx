
import { Helmet } from "react-helmet";
import Hero from "./components/Hero";
import { Route, Routes } from "react-router-dom";
import PricingSection from "./components/PricingSection";
import { TrustedLabels } from "@/components/landing/TrustedLabels";
import SuccessStories from "./components/SuccessStories";
import HowItWorks from "./components/HowItWorks";
import GuaranteedBotFree from "./components/GuaranteedBotFree";
import FAQ from "./components/FAQ";
import { useEffect } from "react";

const SpotifyPlaylistPromotion: React.FC = () => {
  // Add scroll handling for hash links
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  return (
    <>
      <Helmet>
        <title>Spotify Playlist Promotion | Soundraiser</title>
        <meta 
          name="description" 
          content="Boost your music with our Spotify playlist promotion services. Get featured on curated playlists and reach new audiences." 
        />
      </Helmet>

      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={
            <div id="content">
              <div id="hero-search">
                <Hero />
              </div>
              <TrustedLabels isPricingPage={true} />
              <SuccessStories />
              <HowItWorks />
              <GuaranteedBotFree />
              <div id="faq-section">
                <FAQ />
                <div className="flex justify-center pb-12">
                  <a 
                    href="#hero-search"
                    className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full font-medium transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    Start Your Promotion Now
                  </a>
                </div>
              </div>
            </div>
          } />
          <Route path="pricing" element={<PricingSection />} />
        </Routes>
      </main>
    </>
  );
};

export default SpotifyPlaylistPromotion;
