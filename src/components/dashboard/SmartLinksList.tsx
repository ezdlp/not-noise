import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  EditIcon, 
  TrashIcon, 
  ExternalLinkIcon, 
  CopyIcon,
  BarChart2Icon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SmartLinksListProps {
  links?: any[];
  isLoading: boolean;
}

export function SmartLinksList({ links = [], isLoading }: SmartLinksListProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

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
      <div className="text-center py-6">
        <p className="text-muted-foreground">No smart links found</p>
        <Button
          variant="link"
          onClick={() => navigate("/create")}
          className="mt-2"
        >
          Create your first smart link
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Title</TableHead>
            <TableHead>Views</TableHead>
            <TableHead>Clicks</TableHead>
            <TableHead>CTR</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((link) => {
            const views = link.link_views?.length || 0;
            const clicks = link.platform_clicks?.length || 0;
            const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : "0";
            const smartLinkUrl = `${window.location.origin}/link/${link.id}`;

            return (
              <TableRow key={link.id}>
                <TableCell>
                  <div className="flex items-start gap-4">
                    {link.artwork_url && (
                      <img
                        src={link.artwork_url}
                        alt={link.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{link.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {link.artist_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {smartLinkUrl}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(smartLinkUrl)}
                        >
                          <CopyIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{views}</TableCell>
                <TableCell>{clicks}</TableCell>
                <TableCell>{ctr}%</TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(link.created_at), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/link/${link.id}`)}
                        >
                          <ExternalLinkIcon className="w-4 h-4" />
                          <span className="sr-only">View</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View Smart Link</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/links/${link.id}/analytics`)}
                        >
                          <BarChart2Icon className="w-4 h-4" />
                          <span className="sr-only">Analytics</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View Analytics</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/links/${link.id}/edit`)}
                        >
                          <EditIcon className="w-4 h-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit Smart Link</p>
                      </TooltipContent>
                    </Tooltip>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                        >
                          <TrashIcon className="w-4 h-4" />
                          <span className="sr-only">Delete</span>
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
                            onClick={() => deleteMutation.mutate(link.id)}
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
    </TooltipProvider>
  );
}