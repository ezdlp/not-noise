
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link2Icon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SmartLinkCard } from "./SmartLinkCard";
import { Separator } from "@/components/ui/separator";

interface SmartLinksListProps {
  links?: any[];
  isLoading: boolean;
}

export function SmartLinksList({ links = [], isLoading }: SmartLinksListProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState<string>("newest");

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("smart_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smartLinks"] });
      toast.success("Smart link deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting smart link:", error);
      toast.error("Failed to delete smart link");
    },
  });

  const sortedLinks = [...links].sort((a, b) => {
    switch (sortBy) {
      case "most-views":
        return (b.link_views?.length || 0) - (a.link_views?.length || 0);
      case "most-clicks":
        return (b.platform_clicks?.length || 0) - (a.platform_clicks?.length || 0);
      case "highest-ctr": {
        const ctrA = a.link_views?.length ? (a.platform_clicks?.length || 0) / a.link_views.length : 0;
        const ctrB = b.link_views?.length ? (b.platform_clicks?.length || 0) / b.link_views.length : 0;
        return ctrB - ctrA;
      }
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      default: // "newest"
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <Link2Icon className="mx-auto h-12 w-12 text-muted-foreground" />
        <div>
          <p className="text-xl font-semibold">No smart links yet</p>
          <p className="text-muted-foreground">Create your first smart link to start sharing your music</p>
        </div>
        <Button
          variant="default"
          onClick={() => navigate("/create")}
          className="mt-4"
        >
          Create your first smart link
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Link2Icon className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Your Smart Links</h2>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="most-views">Most Views</SelectItem>
              <SelectItem value="most-clicks">Most Clicks</SelectItem>
              <SelectItem value="highest-ctr">Highest CTR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedLinks.map((link) => (
          <SmartLinkCard
            key={link.id}
            link={link}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        ))}
      </div>
    </div>
  );
}
