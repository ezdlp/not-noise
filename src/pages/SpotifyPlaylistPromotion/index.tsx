
import { Helmet } from "react-helmet";

const SpotifyPlaylistPromotion = () => {
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
        {/* Hero section - will be replaced with component */}
        <section className="bg-gradient-to-b from-[#0F0F0F] to-background py-24">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-bold text-white text-center mb-6">
              Boost Your Music with Spotify Playlist Promotion
            </h1>
            <p className="text-lg md:text-xl text-white/80 text-center max-w-2xl mx-auto mb-12">
              Get your music featured on curated playlists and reach new audiences worldwide
            </p>
          </div>
        </section>

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
