
import { Helmet } from "react-helmet";
import Hero from "./components/Hero";
import { TrustedLabels } from "@/components/landing/TrustedLabels";
import SuccessStories from "./components/SuccessStories";
import HowItWorks from "./components/HowItWorks";
import GuaranteedBotFree from "./components/GuaranteedBotFree";
import FAQ from "./components/FAQ";
import { useEffect } from "react";

const SpotifyPlaylistPromotion: React.FC = () => {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  const spotifyServiceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Spotify Playlist Promotion",
    "provider": {
      "@type": "Organization",
      "name": "Soundraiser"
    },
    "description": "Boost your music with our Spotify playlist promotion services. Get featured on curated playlists and reach new audiences.",
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock"
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://soundraiser.io"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Spotify Playlist Promotion",
        "item": "https://soundraiser.io/spotify-playlist-promotion"
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>Spotify Playlist Promotion | Soundraiser</title>
        <meta 
          name="description" 
          content="Boost your music with our Spotify playlist promotion services. Get featured on curated playlists and reach new audiences." 
        />
        <link rel="canonical" href="https://soundraiser.io/spotify-playlist-promotion" />
        <script type="application/ld+json">
          {JSON.stringify(spotifyServiceSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <main className="min-h-screen bg-[#FAFAFA]">
        <div id="content" className="space-y-16 md:space-y-24">
          <div id="hero-search">
            <Hero />
          </div>
          <TrustedLabels isPricingPage={true} />
          <SuccessStories />
          <HowItWorks />
          <GuaranteedBotFree />
          <div id="faq-section" className="pb-16">
            <FAQ />
            <div className="flex justify-center mt-8">
              <a 
                href="#hero-search"
                className="inline-flex items-center justify-center h-12 px-8 font-medium text-white transition-all duration-300 rounded-full bg-primary hover:bg-primary/90 hover:scale-105 shadow-sm"
              >
                Start Your Promotion Now
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default SpotifyPlaylistPromotion;
