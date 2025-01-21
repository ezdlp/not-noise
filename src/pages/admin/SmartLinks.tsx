import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { toast } from "sonner";

interface ViewOrClick {
  id: string;
  viewed_at?: string | null;
  clicked_at?: string | null;
}

export default function SmartLinks() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: smartLinks, isLoading } = useQuery({
    queryKey: ["adminSmartLinks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("smart_links")
        .select(`
          *,
          profiles (
            name,
            email
          ),
          platform_links (
            id
          ),
          link_views (
            id,
            viewed_at
          ),
          platform_clicks (
            id,
            clicked_at
          ),
          email_subscribers (
            id
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load smart links");
        throw error;
      }

      return data;
    },
  });

  const filteredLinks = smartLinks?.filter(
    (link) =>
      link.title.toLowerCase().includes(search.toLowerCase()) ||
      link.artist_name.toLowerCase().includes(search.toLowerCase()) ||
      link.profiles?.name?.toLowerCase().includes(search.toLowerCase())
  );

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
    ];

    const csvData = filteredLinks.map((link) => {
      const views = link.link_views?.length || 0;
      const clicks = link.platform_clicks?.length || 0;
      const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : "0";
      const lastActivity = [...(link.link_views || []), ...(link.platform_clicks || [])]
        .map((item: ViewOrClick) => new Date(item.viewed_at || item.clicked_at || ''))
        .sort((a, b) => b.getTime() - a.getTime())[0];

      return [
        link.title,
        link.artist_name,
        link.profiles?.name || "Unknown",
        new Date(link.created_at).toLocaleDateString(),
        views,
        clicks,
        `${ctr}%`,
        link.email_subscribers?.length || 0,
        lastActivity ? formatDistanceToNow(lastActivity, { addSuffix: true }) : "Never",
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
          <Button onClick={exportToCSV} variant="outline">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Creator</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Views</TableHead>
            <TableHead>Clicks</TableHead>
            <TableHead>CTR</TableHead>
            <TableHead>Subscribers</TableHead>
            <TableHead>Last Activity</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLinks?.map((link) => {
            const views = link.link_views?.length || 0;
            const clicks = link.platform_clicks?.length || 0;
            const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : "0";
            const lastActivity = [...(link.link_views || []), ...(link.platform_clicks || [])]
              .map((item: ViewOrClick) => new Date(item.viewed_at || item.clicked_at || ''))
              .sort((a, b) => b.getTime() - a.getTime())[0];

            return (
              <TableRow key={link.id}>
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
                    <div>{link.profiles?.name || "Unknown"}</div>
                    <div className="text-sm text-muted-foreground">
                      {link.profiles?.email}
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
                            onClick={async () => {
                              const { error } = await supabase
                                .from("smart_links")
                                .delete()
                                .eq("id", link.id);

                              if (error) {
                                toast.error("Failed to delete smart link");
                                return;
                              }

                              toast.success("Smart link deleted successfully");
                            }}
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