
import { Helmet } from "react-helmet";
import Hero from "./components/Hero";
import Features from "./components/Features";

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
        <Hero />
        <Features />
      </main>
    </>
  );
};

export default SpotifyPlaylistPromotion;
