import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FileText, Pencil, Trash2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { PostEditor } from "@/components/admin/blog/PostEditor";
import { ImportPosts } from "@/components/admin/blog/ImportPosts";
import { toast } from "sonner";

export default function Posts() {
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

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
      toast.error("Failed to delete page");
      return;
    }

    toast.success("Page deleted successfully");
  };

  if (isLoading) return <div>Loading...</div>;

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {selectedPost ? "Edit Page" : "Create New Page"}
            </h1>
            <p className="text-muted-foreground">
              {selectedPost ? "Make changes to your page." : "Create a new page."}
            </p>
          </div>
          <Button variant="outline" onClick={() => {
            setIsEditing(false);
            setSelectedPost(null);
          }}>
            Back to Pages
          </Button>
        </div>
        <PostEditor
          post={selectedPost}
          onClose={() => {
            setIsEditing(false);
            setSelectedPost(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pages</h1>
          <p className="text-muted-foreground">Manage your pages.</p>
        </div>
        <div className="flex items-center gap-4">
          <ImportPosts />
          <Button onClick={() => setIsEditing(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Add New Page
          </Button>
        </div>
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
                    setIsEditing(true);
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
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                >
                  <a href={`/${post.slug}`} target="_blank" rel="noopener noreferrer">
                    <Eye className="h-4 w-4" />
                  </a>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}