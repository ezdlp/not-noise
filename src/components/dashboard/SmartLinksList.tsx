import { SmartLinkCard } from "./SmartLinkCard";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface SmartLinksListProps {
  links: any[] | null;
  isLoading: boolean;
  popularityScores?: Record<string, number>;
}

export function SmartLinksList({ links, isLoading, popularityScores = {} }: SmartLinksListProps) {
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!links?.length) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">No smart links yet</h3>
        <p className="text-muted-foreground mb-4">
          Create your first smart link to start sharing your music
        </p>
        <Button asChild>
          <Link to="/links/create">
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Smart Link
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Smart Links</h2>
        <Button asChild>
          <Link to="/links/create">
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Smart Link
          </Link>
        </Button>
      </div>
      <div className="grid gap-4">
        {links.map((link) => (
          <SmartLinkCard 
            key={link.id} 
            link={link} 
            popularityScore={popularityScores[link.id]}
          />
        ))}
      </div>
    </div>
  );
}