
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
  story: string;
  metric: string;
  achievement: string;
};

const successStories: SuccessStory[] = [
  {
    image: '/lovable-uploads/spotify-promo/IMG_0673.PNG',
    story: 'From Independent to Algorithm Success: After securing placements in 8 curated playlists, this trap artist unlocked Spotify\'s powerful Discover Weekly algorithm, expanding their reach to new listeners organically.',
    metric: 'Algorithmic Playlist Achievement',
    achievement: 'Featured in Discover Weekly'
  },
  {
    image: '/lovable-uploads/spotify-promo/IMG_0680.PNG',
    story: 'Starting with 6 strategic playlist placements, this artist\'s momentum caught Spotify\'s attention, leading to features in premium editorial playlists like \'Bedroom Pop\', \'Fresh Finds\', and \'Lorem\'.',
    metric: 'Multiple Editorial Playlist Features',
    achievement: '3 Editorial Playlists'
  },
  {
    image: '/lovable-uploads/spotify-promo/IMG_0696.PNG',
    story: 'Strategic placement in 12 high-engagement playlists activated Spotify\'s Radio algorithm, generating an impressive 185,674 streams in just 28 days.',
    metric: '185K+ Streams in One Month',
    achievement: '185,674 Monthly Streams'
  },
  {
    image: '/lovable-uploads/spotify-promo/IMG_0724.PNG',
    story: 'Through consistent promotion across 50+ genre-specific playlists, this artist\'s music reached Spotify\'s editorial playlists \'Alternative Metal\', \'Heavy Queens\', and \'Sludge\'.',
    metric: 'Editorial Recognition & Sustained Growth',
    achievement: '50+ Playlist Features'
  }
];

const SuccessStories: React.FC = () => {
  const [selectedStory, setSelectedStory] = useState<SuccessStory | null>(null);

  return (
    <section className="py-16 md:py-24 px-4 md:px-6 lg:px-8 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl font-bold mb-4 font-heading">
            Real Artist Success Stories
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            See how independent artists achieved significant streaming growth through our playlist promotion service
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {successStories.map((story, index) => (
            <Card 
              key={index}
              className="overflow-hidden bg-white hover:shadow-lg transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="flex flex-col h-full">
                <div className="relative">
                  <img
                    src={story.image}
                    alt={story.metric}
                    className="w-full h-48 object-cover"
                  />
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                  <span className="text-sm font-medium text-primary mb-2">
                    {story.achievement}
                  </span>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">
                    {story.metric}
                  </h3>
                  <p className="text-gray-600 flex-grow">
                    {story.story}
                  </p>
                  <button
                    onClick={() => setSelectedStory(story)}
                    className="mt-4 text-primary font-medium hover:underline"
                  >
                    Read Full Story
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Dialog 
          open={!!selectedStory} 
          onOpenChange={() => setSelectedStory(null)}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Success Story</DialogTitle>
              <button
                onClick={() => setSelectedStory(null)}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </DialogHeader>

            {selectedStory && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                <div className="relative">
                  <img
                    src={selectedStory.image}
                    alt={selectedStory.metric}
                    className="w-full rounded-lg object-cover"
                  />
                </div>
                <div>
                  <span className="inline-block bg-primary text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
                    {selectedStory.achievement}
                  </span>
                  <h3 className="text-2xl font-bold mb-4">
                    {selectedStory.metric}
                  </h3>
                  <p className="text-gray-600">
                    {selectedStory.story}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default SuccessStories;
