
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

type SuccessStory = {
  image: string;
  genre: string;
  story: string;
  metric: string;
};

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
  const [selectedStory, setSelectedStory] = useState<SuccessStory | null>(null);

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {successStories.map((story, index) => (
            <Card 
              key={index}
              className="relative overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 
                hover:shadow-xl transition-all duration-300 animate-fade-in cursor-pointer 
                hover:scale-[1.02] max-w-md mx-auto w-full"
              style={{ animationDelay: `${index * 150}ms` }}
              onClick={() => setSelectedStory(story)}
            >
              <div className="relative h-[420px]">
                <img
                  src={story.image}
                  alt={`${story.genre} Artist Success Story`}
                  className="w-full h-full object-cover"
                />
                <div 
                  className="absolute inset-0 bg-gradient-to-t 
                    from-[rgba(26,31,44,0.95)] via-[rgba(26,31,44,0.7)] to-transparent"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-primary text-white px-6 py-2 rounded-full text-base font-medium">
                    {story.genre}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <p className="font-bold text-2xl mb-3 text-shadow">
                    {story.metric}
                  </p>
                  <p className="text-base text-gray-100 leading-relaxed line-clamp-4">
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

      <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
        <DialogContent className="max-w-6xl w-full h-[90vh] overflow-y-auto">
          <DialogHeader className="flex justify-between items-center">
            <button
              onClick={() => setSelectedStory(null)}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </DialogHeader>

          {selectedStory && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-2 lg:p-6">
              <div className="relative h-[500px] lg:h-full">
                <img
                  src={selectedStory.image}
                  alt={`${selectedStory.genre} Success Story`}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              
              <div className="flex flex-col justify-center">
                <span className="inline-block bg-primary text-white px-6 py-2 rounded-full text-base font-medium mb-6 w-fit">
                  {selectedStory.genre}
                </span>
                <h3 className="text-3xl font-bold mb-6 text-gray-900">
                  {selectedStory.metric}
                </h3>
                <p className="text-lg leading-relaxed text-gray-700">
                  {selectedStory.story}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default SuccessStories;

