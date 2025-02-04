
import { Helmet } from "react-helmet";
import Hero from "./components/Hero";

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

        {/* Placeholder sections - will be replaced with components */}
        <section className="py-24 bg-background" id="features">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
              Coming Soon
            </h2>
          </div>
        </section>
      </main>
    </>
  );
};

export default SpotifyPlaylistPromotion;

