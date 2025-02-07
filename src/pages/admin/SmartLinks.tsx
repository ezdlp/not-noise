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
  user?: Profile;
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
          user:user_id (
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

      return data;
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
      toast.success(
        selectedLinks.size > 1 
          ? "Smart links deleted successfully" 
          : "Smart link deleted successfully"
      );
      setSelectedLinks(new Set());
    },
    onError: (error) => {
      console.error("Error deleting smart links:", error);
      toast.error("Failed to delete smart links");
    },
  });

  const filteredLinks = smartLinks?.filter(
    (link) =>
      link.title.toLowerCase().includes(search.toLowerCase()) ||
      link.artist_name.toLowerCase().includes(search.toLowerCase()) ||
      link.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedLinks.size === filteredLinks?.length) {
      setSelectedLinks(new Set());
    } else {
      setSelectedLinks(new Set(filteredLinks?.map(link => link.id)));
    }
  };

  const handleSelectLink = (id: string) => {
    const newSelected = new Set(selectedLinks);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLinks(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedLinks.size === 0) return;
    deleteMutation.mutate(Array.from(selectedLinks));
  };

  const exportToCSV = () => {
    if (!smartLinks) return;

    const headers = [
      "Title",
      "Artist",
      "Creator",
      "Created Date",
      "Views",
      "Clicks",
      "CTR",
      "Subscribers",
      "Last Activity",
      "Platform Links"
    ];

    const csvData = filteredLinks.map((link) => {
      const views = link.link_views?.length || 0;
      const clicks = link.platform_links?.reduce(
        (total, pl) => total + (pl.platform_clicks?.length || 0),
        0
      ) || 0;
      const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : "0";
      
      const allActivities = [
        ...(link.link_views || []).map((view) => ({ 
          date: view.viewed_at,
          type: 'view' 
        })),
        ...(link.platform_links || []).flatMap(pl => 
          (pl.platform_clicks || []).map(click => ({ 
            date: click.clicked_at,
            type: 'click' 
          }))
        )
      ].filter(activity => activity.date !== null);
      
      const lastActivity = allActivities.length > 0 
        ? new Date(allActivities.reduce((latest, current) => {
            const currentDate = new Date(current.date || '');
            return currentDate > latest ? currentDate : latest;
          }, new Date(0)))
        : null;

      const platformLinks = link.platform_links?.map(pl => pl.platform_id).join(", ") || "None";

      return [
        link.title,
        link.artist_name,
        link.user?.name || "Unknown",
        new Date(link.created_at).toLocaleDateString(),
        views,
        clicks,
        `${ctr}%`,
        link.email_subscribers?.length || 0,
        lastActivity ? formatDistanceToNow(lastActivity, { addSuffix: true }) : "Never",
        platformLinks
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...csvData].map((row) => row.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "smart-links.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Smart Links</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, artist or creator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
          {selectedLinks.size > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  Delete Selected ({selectedLinks.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Smart Links</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedLinks.size} smart link{selectedLinks.size > 1 ? 's' : ''}? 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleBulkDelete}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={exportToCSV} variant="outline">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30px]">
              <Checkbox 
                checked={selectedLinks.size === filteredLinks?.length && filteredLinks.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Creator</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Views</TableHead>
            <TableHead>Clicks</TableHead>
            <TableHead>CTR</TableHead>
            <TableHead>Subscribers</TableHead>
            <TableHead>Platforms</TableHead>
            <TableHead>Last Activity</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLinks?.map((link) => {
            const views = link.link_views?.length || 0;
            const clicks = link.platform_links?.reduce(
              (total, pl) => total + (pl.platform_clicks?.length || 0),
              0
            ) || 0;
            const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : "0";
            
            const allActivities = [
              ...(link.link_views || []).map((view) => ({ 
                date: view.viewed_at,
                type: 'view' 
              })),
              ...(link.platform_links || []).flatMap(pl => 
                (pl.platform_clicks || []).map(click => ({ 
                  date: click.clicked_at,
                  type: 'click' 
                }))
              )
            ].filter(activity => activity.date !== null);
            
            const lastActivity = allActivities.length > 0 
              ? new Date(allActivities.reduce((latest, current) => {
                  const currentDate = new Date(current.date || '');
                  return currentDate > latest ? currentDate : latest;
                }, new Date(0)))
              : null;

            return (
              <TableRow key={link.id}>
                <TableCell>
                  <Checkbox 
                    checked={selectedLinks.has(link.id)}
                    onCheckedChange={() => handleSelectLink(link.id)}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{link.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {link.artist_name}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div>{link.user?.name || "Unknown"}</div>
                    <div className="text-sm text-muted-foreground">
                      {link.user?.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(link.created_at), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>{views}</TableCell>
                <TableCell>{clicks}</TableCell>
                <TableCell>{ctr}%</TableCell>
                <TableCell>{link.email_subscribers?.length || 0}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {link.platform_links && link.platform_links.length > 0 
                      ? link.platform_links.map(pl => pl.platform_id).join(", ")
                      : "None"}
                  </div>
                </TableCell>
                <TableCell>
                  {lastActivity
                    ? formatDistanceToNow(lastActivity, { addSuffix: true })
                    : "Never"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/link/${link.id}`, "_blank")}
                    >
                      <ExternalLinkIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/smart-links/${link.id}/analytics`)}
                    >
                      <BarChart2Icon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/links/${link.id}/edit`)}
                    >
                      <EditIcon className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Smart Link</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{link.title}"? This action
                            cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate([link.id])}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
