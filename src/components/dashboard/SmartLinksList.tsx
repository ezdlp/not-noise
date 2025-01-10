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
import { EditIcon, TrashIcon, ExternalLinkIcon } from "lucide-react";
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Platforms</TableHead>
          <TableHead>Views</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {links.map((link) => (
          <TableRow key={link.id}>
            <TableCell className="font-medium">{link.title}</TableCell>
            <TableCell>{link.platform_links?.length || 0}</TableCell>
            <TableCell>{link.link_views?.length || 0}</TableCell>
            <TableCell>
              {formatDistanceToNow(new Date(link.created_at), {
                addSuffix: true,
              })}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/links/${link.id}`)}
                >
                  <ExternalLinkIcon className="w-4 h-4" />
                  <span className="sr-only">View</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/links/${link.id}/edit`)}
                >
                  <EditIcon className="w-4 h-4" />
                  <span className="sr-only">Edit</span>
                </Button>
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
        ))}
      </TableBody>
    </Table>
  );
}