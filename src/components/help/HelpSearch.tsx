
import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HelpSearchProps {
  onSearch: (query: string) => void;
  className?: string;
}

export function HelpSearch({ onSearch, className }: HelpSearchProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  useEffect(() => {
    // Clear search results when query is empty
    if (query === "") {
      onSearch("");
    }
  }, [query, onSearch]);

  return (
    <form 
      onSubmit={handleSearch}
      className={cn("relative", className)}
    >
      <Input
        ref={inputRef}
        type="search"
        placeholder="Search help articles..."
        className="pr-10 h-11"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Button 
        type="submit" 
        size="icon" 
        variant="ghost" 
        className="absolute right-0 top-0 h-11 w-11"
      >
        <Search className="h-4 w-4" />
        <span className="sr-only">Search</span>
      </Button>
    </form>
  );
}
