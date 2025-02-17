
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import CTAScrollButton from './CTAScrollButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

type SuccessStory = {
  image: string;
  genre: string;
  story: string;
  metric: string;
  achievement: string;
};

const successStories: SuccessStory[] = [
  {
    image: '/lovable-uploads/spotify-promo/IMG_0673.PNG',
    genre: 'Trap',
    story: 'From Independent to Algorithm Success: After securing placements in 8 curated playlists, this trap artist unlocked Spotify\'s powerful Discover Weekly algorithm, expanding their reach to new listeners organically.',
    metric: 'Algorithmic Playlist Achievement',
    achievement: 'Featured in Discover Weekly'
  },
  {
    image: '/lovable-uploads/spotify-promo/IMG_0680.PNG',
    genre: 'Indie',
    story: 'Indie Success Story: Starting with 6 strategic playlist placements, this artist\'s momentum caught Spotify\'s attention, leading to features in premium editorial playlists like \'Bedroom Pop\', \'Fresh Finds\', and \'Lorem\'.',
    metric: 'Multiple Editorial Playlist Features',
    achievement: '3 Editorial Playlists'
  },
  {
    image: '/lovable-uploads/spotify-promo/IMG_0696.PNG',
    genre: 'Electronic',
    story: 'Electronic Breakthrough: Strategic placement in 12 high-engagement playlists activated Spotify\'s Radio algorithm, generating an impressive 185,674 streams in just 28 days.',
    metric: '185K+ Streams in One Month',
    achievement: '185,674 Monthly Streams'
  },
  {
    image: '/lovable-uploads/spotify-promo/IMG_0724.PNG',
    genre: 'Metal',
    story: 'Metal Scene Domination: Through consistent promotion across 50+ genre-specific playlists, this artist\'s music reached Spotify\'s editorial playlists \'Alternative Metal\', \'Heavy Queens\', and \'Sludge\'.',
    metric: 'Editorial Recognition & Sustained Growth',
    achievement: '50+ Playlist Features'
  }
];

const genres = ['All Genres', 'Trap', 'Indie', 'Electronic', 'Metal'];

const SuccessStories: React.FC = () => {
  const [selectedStory, setSelectedStory] = useState<SuccessStory | null>(null);
  const [activeGenre, setActiveGenre] = useState('All Genres');

  const filteredStories = activeGenre === 'All Genres' 
    ? successStories 
    : successStories.filter(story => story.genre === activeGenre);

  return (
    <section className="py-16 md:py-24 px-4 md:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl font-bold mb-4 font-heading">
            Real Artist Success Stories
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            See how independent artists achieved significant streaming growth through our playlist promotion service
          </p>
        </div>

        <Tabs defaultValue="All Genres" className="mb-8">
          <TabsList className="justify-center">
            {genres.map((genre) => (
              <TabsTrigger
                key={genre}
                value={genre}
                onClick={() => setActiveGenre(genre)}
              >
                {genre}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {filteredStories.map((story, index) => (
            <Card 
              key={index}
              className="overflow-hidden bg-white hover:shadow-lg transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="flex flex-col md:flex-row h-full">
                <div className="md:w-2/5 relative">
                  <img
                    src={story.image}
                    alt={`${story.genre} Success Story`}
                    className="w-full h-48 md:h-full object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <HoverCard>
                      <HoverCardTrigger>
                        <span className="bg-primary/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                          {story.achievement}
                        </span>
                      </HoverCardTrigger>
                      <HoverCardContent>
                        <p className="text-sm">{story.metric}</p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                </div>
                
                <div className="p-6 md:w-3/5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-primary">
                        {story.genre}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900">
                      {story.metric}
                    </h3>
                    <p className="text-gray-600 line-clamp-3">
                      {story.story}
                    </p>
                  </div>
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
                    alt={`${selectedStory.genre} Success Story`}
                    className="w-full rounded-lg object-cover"
                  />
                </div>
                <div>
                  <span className="inline-block bg-primary text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
                    {selectedStory.genre}
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

        <div className="text-center">
          <CTAScrollButton text="Start Your Success Story" />
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;
