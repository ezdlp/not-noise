
import React from 'react';
import { Card } from '@/components/ui/card';

const successStories = [
  {
    image: '/lovable-uploads/spotify-promo/IMG_0673.PNG',
    genre: 'Trap',
    story: 'From Independent to Algorithm Success: After securing placements in 8 curated playlists, this trap artist unlocked Spotify\'s powerful Discover Weekly algorithm, expanding their reach to new listeners organically.',
    metric: 'Algorithmic Playlist Achievement'
  },
  {
    image: '/lovable-uploads/spotify-promo/IMG_0680.PNG',
    genre: 'Indie',
    story: 'Indie Success Story: Starting with 6 strategic playlist placements, this artist\'s momentum caught Spotify\'s attention, leading to features in premium editorial playlists like \'Bedroom Pop\', \'Fresh Finds\', and \'Lorem\'.',
    metric: 'Multiple Editorial Playlist Features'
  },
  {
    image: '/lovable-uploads/spotify-promo/IMG_0696.PNG',
    genre: 'Electronic',
    story: 'Electronic Breakthrough: Strategic placement in 12 high-engagement playlists activated Spotify\'s Radio algorithm, generating an impressive 185,674 streams in just 28 days.',
    metric: '185K+ Streams in One Month'
  },
  {
    image: '/lovable-uploads/spotify-promo/IMG_0724.PNG',
    genre: 'Metal',
    story: 'Metal Scene Domination: Through consistent promotion across 50+ genre-specific playlists, this artist\'s music reached Spotify\'s editorial playlists \'Alternative Metal\', \'Heavy Queens\', and \'Sludge\'.',
    metric: 'Editorial Recognition & Sustained Growth'
  }
];

const SuccessStories: React.FC = () => {
  return (
    <section className="py-20 px-4 md:px-8 lg:px-12 relative overflow-hidden bg-[#F1F0FB]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl font-bold mb-4 font-heading">
            Real Artist Success Stories
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            See how independent artists achieved significant streaming growth through our playlist promotion service
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {successStories.map((story, index) => (
            <Card 
              key={index}
              className="relative overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 
                hover:shadow-lg transition-all duration-300 animate-fade-in max-w-sm mx-auto w-full"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="relative h-[480px]">
                <img
                  src={story.image}
                  alt={`${story.genre} Artist Success Story`}
                  className="w-full h-full object-cover"
                />
                <div 
                  className="absolute inset-0 bg-gradient-to-t from-[rgba(26,31,44,0.9)] via-[rgba(26,31,44,0.6)] to-transparent"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-primary/10 text-primary px-4 py-1 rounded-full text-sm font-medium">
                    {story.genre}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <p className="font-semibold text-xl mb-3">
                    {story.metric}
                  </p>
                  <p className="text-sm text-gray-200 line-clamp-4">
                    {story.story}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <p className="text-center text-lg text-gray-600 max-w-3xl mx-auto animate-fade-in">
          And we have similar success stories across every genre, including Latin, Pop, Rock, R&B, Lo-fi, Ambient and many more!
        </p>
      </div>
    </section>
  );
};

export default SuccessStories;

