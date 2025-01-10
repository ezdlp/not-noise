import { Button } from "@/components/ui/button";

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
  const artworkUrl = "https://images.unsplash.com/photo-1498050108023-c5249f4df085";

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center">
      {/* Blurred background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${artworkUrl})`,
          filter: 'blur(30px) brightness(0.7)',
          transform: 'scale(1.1)'
        }}
      />

      {/* Content */}
      <div className="relative w-full max-w-md mx-auto px-4 py-8 z-10">
        <div className="text-center mb-8">
          <img
            src={artworkUrl}
            alt="Album Cover"
            className="w-72 h-72 mx-auto rounded-2xl shadow-xl mb-6 object-cover"
          />
          <h1 className="text-2xl font-bold mb-1 text-white">Track Title</h1>
          <p className="text-lg text-white/80">Artist Name</p>
        </div>
        
        <div className="space-y-3">
          {platforms.map((platform) => (
            <div 
              key={platform.name}
              className="flex items-center justify-between p-3 bg-white/95 backdrop-blur-sm rounded-xl hover:bg-white transition-colors duration-200"
            >
              <div className="flex items-center gap-3">
                <img 
                  src={platform.icon} 
                  alt={`${platform.name} logo`}
                  className="w-8 h-8 object-contain"
                />
                <span className="font-medium text-gray-900">{platform.name}</span>
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
        
        <div className="mt-8 text-center">
          <p className="text-sm text-white/60">Powered by Soundraiser</p>
        </div>
      </div>
    </div>
  );
};

export default SmartLink;