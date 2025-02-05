
import { Music, Guitar, Headphones, Mic } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SuccessStoryProps {
  image: string;
  genre: string;
  icon: React.ReactNode;
  story: string;
  metric: string;
}

const SuccessStory = ({ image, genre, icon, story, metric }: SuccessStoryProps) => (
  <Card className="overflow-hidden group relative transition-all duration-300 hover:shadow-lg">
    <div className="aspect-video relative">
      <img 
        src={image} 
        alt={`${genre} success story`} 
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
    </div>
    <div className="p-6 relative">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
        <span className="font-medium text-primary">{genre}</span>
      </div>
      <p className="text-sm text-gray-700 mb-4">{story}</p>
      <div className="bg-primary/5 rounded-lg p-3">
        <p className="font-medium text-sm text-primary">Key Achievement:</p>
        <p className="text-sm text-gray-600">{metric}</p>
      </div>
    </div>
  </Card>
);

const SUCCESS_STORIES: SuccessStoryProps[] = [
  {
    image: "/lovable-uploads/1312b6ce-b7d7-473c-8627-3a0fdb32da04.png",
    genre: "Trap",
    icon: <Music className="w-5 h-5 text-primary" />,
    story: "From Independent to Algorithm Success: After securing placements in 8 curated playlists, this trap artist unlocked Spotify's powerful Discover Weekly algorithm, expanding their reach to new listeners organically.",
    metric: "Algorithmic Playlist Achievement"
  },
  {
    image: "/lovable-uploads/22968a81-5926-495f-a455-f522820e639f.png",
    genre: "Indie",
    icon: <Guitar className="w-5 h-5 text-primary" />,
    story: "Indie Success Story: Starting with 6 strategic playlist placements, this artist's momentum caught Spotify's attention, leading to features in premium editorial playlists like 'Bedroom Pop', 'Fresh Finds', and 'Lorem'.",
    metric: "Multiple Editorial Playlist Features"
  },
  {
    image: "/lovable-uploads/28f75700-3d24-45a7-8bca-02635c910bf8.png",
    genre: "Electronic",
    icon: <Headphones className="w-5 h-5 text-primary" />,
    story: "Electronic Breakthrough: Strategic placement in 12 high-engagement playlists activated Spotify's Radio algorithm, generating an impressive 185,674 streams in just 28 days.",
    metric: "185K+ Streams in One Month"
  },
  {
    image: "/lovable-uploads/39a6879b-3c04-4dae-b21d-e7c9c538ffc3.png",
    genre: "Metal",
    icon: <Mic className="w-5 h-5 text-primary" />,
    story: "Metal Scene Domination: Through consistent promotion across 50+ genre-specific playlists, this artist's music reached Spotify's editorial playlists 'Alternative Metal', 'Heavy Queens', and 'Sludge'.",
    metric: "Editorial Recognition & Sustained Growth"
  }
];

export const SuccessStories = () => {
  return (
    <section className="py-20 bg-neutral-seasalt">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Real Artist Success Stories
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how independent artists achieved significant streaming growth through our playlist promotion service
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {SUCCESS_STORIES.map((story, index) => (
            <SuccessStory key={index} {...story} />
          ))}
        </div>

        <p className="text-center text-xl text-gray-700 max-w-3xl mx-auto font-medium">
          And we have similar success stories across every genre, including Latin, Pop, Rock, R&B, Lo-fi, Ambient and many more!
        </p>
      </div>
    </section>
  );
};
