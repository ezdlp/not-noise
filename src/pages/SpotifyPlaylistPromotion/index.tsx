
import { Helmet } from "react-helmet";
import Hero from "./components/Hero";
import { Route, Routes } from "react-router-dom";
import PricingSection from "./components/PricingSection";
import { TrustedLabels } from "@/components/landing/TrustedLabels";
import SuccessStories from "./components/SuccessStories";
import HowItWorks from "./components/HowItWorks";

const SpotifyPlaylistPromotion: React.FC = () => {
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
            <>
              <Hero />
              <TrustedLabels isPricingPage={true} />
              <SuccessStories />
              <HowItWorks />
            </>
          } />
          <Route path="pricing" element={<PricingSection />} />
        </Routes>
      </main>
    </>
  );
};

export default SpotifyPlaylistPromotion;
