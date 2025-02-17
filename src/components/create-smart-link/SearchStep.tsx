
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Music, ListMusic } from "lucide-react";

interface SearchStepProps {
  onNext: (data: any) => void;
}

const SearchStep = ({ onNext }: SearchStepProps) => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contentType, setContentType] = useState<'track' | 'album' | 'playlist' | null>(null);

  useEffect(() => {
    // Detect content type from URL
    if (url.includes("spotify.com")) {
      if (url.includes("/playlist/")) {
        setContentType('playlist');
      } else if (url.includes("/album/")) {
        setContentType('album');
      } else if (url.includes("/track/")) {
        setContentType('track');
      } else {
        setContentType(null);
      }
    } else {
      setContentType(null);
    }
  }, [url]);

  const handleSearch = async () => {
    if (!url.trim()) {
      toast.error("Please enter a Spotify URL");
      return;
    }

    if (!url.includes("spotify.com")) {
      toast.error("Please enter a valid Spotify URL");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("spotify-search", {
        body: { url }
      });

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("No data returned from Spotify");
      }

      onNext({
        ...data,
        spotifyUrl: url,
        content_type: contentType || 'track'
      });
    } catch (error) {
      console.error("Error searching Spotify:", error);
      toast.error("Failed to fetch track information. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg sm:text-xl font-semibold">Find Your Music</h2>
        <p className="text-sm text-muted-foreground">
          Enter a Spotify URL to get started
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="spotify-url">Spotify URL</Label>
          <div className="space-y-2">
            <Input
              id="spotify-url"
              placeholder="https://open.spotify.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-10"
            />
            {contentType && (
              <Badge 
                variant="secondary" 
                className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                {contentType === 'playlist' ? (
                  <ListMusic className="w-3 h-3 mr-1" />
                ) : (
                  <Music className="w-3 h-3 mr-1" />
                )}
                {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Paste your Spotify track, album, or playlist URL
          </p>
        </div>

        <Button
          onClick={handleSearch}
          disabled={isLoading || !url.trim()}
          className="w-full"
        >
          {isLoading ? "Searching..." : "Continue"}
        </Button>
      </div>
    </div>
  );
};

export default SearchStep;
