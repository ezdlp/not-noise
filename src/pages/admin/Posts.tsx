import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FileText, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Posts() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["adminPosts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*");
      return data;
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
          <p className="text-muted-foreground">Manage your blog content.</p>
        </div>
        <Button>
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
                <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                  {post.status}
                </Badge>
              </TableCell>
              <TableCell>{new Date(post.created_at).toLocaleDateString()}</TableCell>
              <TableCell>{new Date(post.updated_at).toLocaleDateString()}</TableCell>
              <TableCell className="space-x-2">
                <Button variant="ghost" size="icon">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}