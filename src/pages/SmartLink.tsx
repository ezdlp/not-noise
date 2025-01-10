import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const platforms = [
  { 
    name: "Spotify", 
    color: "bg-[#1DB954]",
    icon: "/lovable-uploads/spotify.png",
    action: "Play"
  },
  { 
    name: "Apple Music", 
    color: "bg-black",
    icon: "/lovable-uploads/applemusic.png",
    action: "Play"
  },
  { 
    name: "Amazon Music", 
    color: "bg-[#00A8E1]",
    icon: "/lovable-uploads/amazonmusic.png",
    action: "Play"
  },
  { 
    name: "Deezer", 
    color: "bg-[#00C7F2]",
    icon: "/lovable-uploads/deezer.png",
    action: "Play"
  },
  { 
    name: "Tidal", 
    color: "bg-black",
    icon: "/lovable-uploads/tidal.png",
    action: "Play"
  },
  { 
    name: "SoundCloud", 
    color: "bg-[#FF5500]",
    icon: "/lovable-uploads/soundcloud.png",
    action: "Play"
  },
  { 
    name: "iTunes Store", 
    color: "bg-[#FB5BC5]",
    icon: "/lovable-uploads/itunes.png",
    action: "Download"
  },
];

const SmartLink = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 py-8">
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl p-6">
        <div className="text-center mb-8">
          <img
            src="https://images.unsplash.com/photo-1498050108023-c5249f4df085"
            alt="Album Cover"
            className="w-72 h-72 mx-auto rounded-2xl shadow-lg mb-6 object-cover"
          />
          <h1 className="text-2xl font-bold mb-1">Track Title</h1>
          <p className="text-lg text-muted-foreground">Artist Name</p>
        </div>
        
        <div className="space-y-3">
          {platforms.map((platform) => (
            <div 
              key={platform.name}
              className="flex items-center justify-between p-3 border rounded-xl hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3">
                <img 
                  src={platform.icon} 
                  alt={`${platform.name} logo`}
                  className="w-8 h-8 object-contain"
                />
                <span className="font-medium">{platform.name}</span>
              </div>
              <Button
                variant="default"
                className="bg-black hover:bg-black/90 text-white min-w-[100px]"
              >
                {platform.action}
              </Button>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Powered by Soundraiser</p>
        </div>
      </div>
    </div>
  );
};

export default SmartLink;