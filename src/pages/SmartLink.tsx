import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const platforms = [
  { name: "Spotify", color: "bg-[#1DB954]" },
  { name: "Apple Music", color: "bg-[#FA57C1]" },
  { name: "YouTube Music", color: "bg-[#FF0000]" },
];

const SmartLink = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="max-w-lg w-full mx-auto p-6">
        <div className="text-center mb-8">
          <img
            src="https://images.unsplash.com/photo-1498050108023-c5249f4df085"
            alt="Album Cover"
            className="w-64 h-64 mx-auto rounded-lg shadow-xl mb-6"
          />
          <h1 className="text-3xl font-bold mb-2">Track Title</h1>
          <p className="text-lg text-muted-foreground">Artist Name</p>
        </div>
        
        <div className="space-y-4">
          {platforms.map((platform) => (
            <Button
              key={platform.name}
              className={`w-full ${platform.color} hover:opacity-90 transition-opacity text-white`}
            >
              Listen on {platform.name}
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          ))}
        </div>
        
        <div className="mt-12 text-center text-sm text-muted-foreground">
          Powered by Soundraiser
        </div>
      </div>
    </div>
  );
};

export default SmartLink;