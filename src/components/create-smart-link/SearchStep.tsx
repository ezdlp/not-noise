import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";

interface SearchStepProps {
  onNext: (trackData: any) => void;
}

const SearchStep = ({ onNext }: SearchStepProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const handleSearch = () => {
    // Mock data - in a real app, this would come from Spotify API
    const mockTrackData = {
      title: searchQuery || "Example Track",
      artist: "Example Artist",
      album: "Example Album",
      coverUrl: "/placeholder.svg",
    };
    
    toast.success("Track found!");
    onNext(mockTrackData);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Search Your Track</h2>
        <p className="text-sm text-muted-foreground">
          Search for your track on Spotify to get started
        </p>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Search by track name or artist..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={!searchQuery.trim()}>
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
      </div>
    </div>
  );
};

export default SearchStep;