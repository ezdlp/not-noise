
import React from 'react';
import { Music, Guitar, Headphones, Mic } from 'lucide-react';
import { Card } from '@/components/ui/card';

const successStories = [
  {
    image: '/lovable-uploads/spotify-promo/IMG_0673.PNG',
    genre: 'Trap',
    icon: Music,
    story: 'From Independent to Algorithm Success: After securing placements in 8 curated playlists, this trap artist unlocked Spotify\'s powerful Discover Weekly algorithm, expanding their reach to new listeners organically.',
    metric: 'Algorithmic Playlist Achievement'
  },
  {
    image: '/lovable-uploads/spotify-promo/IMG_0680.PNG',
    genre: 'Indie',
    icon: Guitar,
    story: 'Indie Success Story: Starting with 6 strategic playlist placements, this artist\'s momentum caught Spotify\'s attention, leading to features in premium editorial playlists like \'Bedroom Pop\', \'Fresh Finds\', and \'Lorem\'.',
    metric: 'Multiple Editorial Playlist Features'
  },
  {
    image: '/lovable-uploads/spotify-promo/IMG_0696.PNG',
    genre: 'Electronic',
    icon: Headphones,
    story: 'Electronic Breakthrough: Strategic placement in 12 high-engagement playlists activated Spotify\'s Radio algorithm, generating an impressive 185,674 streams in just 28 days.',
    metric: '185K+ Streams in One Month'
  },
  {
    image: '/lovable-uploads/spotify-promo/IMG_0724.PNG',
    genre: 'Metal',
    icon: Mic,
    story: 'Metal Scene Domination: Through consistent promotion across 50+ genre-specific playlists, this artist\'s music reached Spotify\'s editorial playlists \'Alternative Metal\', \'Heavy Queens\', and \'Sludge\'.',
    metric: 'Editorial Recognition & Sustained Growth'
  }
];

const SuccessStories: React.FC = () => {
  return (
    <section className="py-20 px-4 md:px-8 lg:px-12 relative overflow-hidden">
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
          {successStories.map((story, index) => {
            const Icon = story.icon;
            return (
              <Card 
                key={index}
                className="relative overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 
                  hover:shadow-lg transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="aspect-[9/16] relative">
                  <img
                    src={story.image}
                    alt={`${story.genre} Artist Success Story`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-primary/10 text-primary rounded-full p-2">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-primary">{story.genre}</span>
                  </div>
                  <p className="text-gray-700 mb-4 line-clamp-4">
                    {story.story}
                  </p>
                  <div className="bg-primary/5 rounded-lg p-4">
                    <p className="font-semibold text-primary">
                      {story.metric}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-lg text-gray-600 max-w-3xl mx-auto animate-fade-in">
          And we have similar success stories across every genre, including Latin, Pop, Rock, R&B, Lo-fi, Ambient and many more!
        </p>
      </div>
    </section>
  );
};

export default SuccessStories;
