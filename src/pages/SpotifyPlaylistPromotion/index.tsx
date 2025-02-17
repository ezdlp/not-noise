import { Helmet } from "react-helmet";
import Hero from "./components/Hero";
import { TrustedLabels } from "@/components/landing/TrustedLabels";
import SuccessStories from "./components/SuccessStories";
import HowItWorks from "./components/HowItWorks";
import GuaranteedBotFree from "./components/GuaranteedBotFree";
import FAQ from "./components/FAQ";
import { useEffect } from "react";
import { Footer } from "@/components/landing/Footer";

const SpotifyPlaylistPromotion: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
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

      <main className="min-h-screen bg-white">
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
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
};

export default SpotifyPlaylistPromotion;
