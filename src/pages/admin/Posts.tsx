import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FileText, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { PostEditor } from "@/components/admin/blog/PostEditor";
import { toast } from "sonner";

export default function Posts() {
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["adminPosts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (postId: string) => {
    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      toast.error("Failed to delete post");
      return;
    }

    toast.success("Post deleted successfully");
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
          <p className="text-muted-foreground">Manage your blog content.</p>
        </div>
        <Button onClick={() => setIsEditorOpen(true)}>
          <FileText className="mr-2 h-4 w-4" />
          Add New Post
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts?.map((post) => (
            <TableRow key={post.id}>
              <TableCell>{post.title}</TableCell>
              <TableCell>
                <Badge variant={post.status === "published" ? "default" : "secondary"}>
                  {post.status}
                </Badge>
              </TableCell>
              <TableCell>{new Date(post.created_at).toLocaleDateString()}</TableCell>
              <TableCell>{new Date(post.updated_at).toLocaleDateString()}</TableCell>
              <TableCell className="space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedPost(post);
                    setIsEditorOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(post.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedPost ? "Edit Post" : "Create New Post"}</DialogTitle>
          </DialogHeader>
          <PostEditor
            post={selectedPost}
            onClose={() => {
              setIsEditorOpen(false);
              setSelectedPost(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}