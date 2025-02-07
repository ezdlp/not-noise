import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ExternalLinkIcon, 
  BarChart2Icon, 
  EditIcon, 
  TrashIcon,
  DownloadIcon,
  SearchIcon
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LinkView {
  id: string;
  viewed_at: string | null;
}

interface PlatformClick {
  id: string;
  clicked_at: string | null;
}

interface PlatformLink {
  id: string;
  platform_id: string;
  url: string;
  platform_clicks: PlatformClick[];
}

interface Profile {
  name: string | null;
  email: string | null;
}

interface SmartLink {
  id: string;
  title: string;
  artist_name: string;
  created_at: string;
  user_id: string;
  profiles: {
    name: string;
    email: string | null;
  } | null;
  link_views?: LinkView[];
  platform_links?: PlatformLink[];
  email_subscribers?: { id: string }[];
}

export default function SmartLinks() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedLinks, setSelectedLinks] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: smartLinks, isLoading } = useQuery({
    queryKey: ["adminSmartLinks"],
    queryFn: async () => {
      console.log("Fetching smart links with platform links...");
      const { data, error } = await supabase
        .from("smart_links")
        .select(`
          *,
          profiles:user_id (
            name,
            email
          ),
          platform_links (
            id,
            platform_id,
            url,
            platform_clicks (
              id,
              clicked_at
            )
          ),
          link_views (
            id,
            viewed_at
          ),
          email_subscribers (
            id
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching smart links:", error);
        toast.error("Failed to load smart links");
        throw error;
      }

      return data as SmartLink[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("smart_links")
        .delete()
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminSmartLinks"] });
      toast.success("Smart link deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting smart link:", error);
      toast.error("Failed to delete smart link");
    },
  });

  const sortedLinks = [...smartLinks].sort((a, b) => {
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

  if (smartLinks.length === 0) {
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
