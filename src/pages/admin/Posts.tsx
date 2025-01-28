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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Posts() {
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: ["adminPosts", selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select(`
          *,
          blog_post_categories!inner (
            blog_categories (
              id,
              name
            )
          )
        `)
        .order("published_at", { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('blog_post_categories.category_id', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (postId: string) => {
    try {
      // Delete post tags first
      const { error: tagsError } = await supabase
        .from("blog_posts_tags")
        .delete()
        .eq("post_id", postId);

      if (tagsError) {
        console.error("Error deleting post tags:", tagsError);
        toast.error("Failed to delete post tags");
        return;
      }

      // Delete post categories
      const { error: categoriesError } = await supabase
        .from("blog_post_categories")
        .delete()
        .eq("post_id", postId);

      if (categoriesError) {
        console.error("Error deleting post categories:", categoriesError);
        toast.error("Failed to delete post categories");
        return;
      }

      // Finally delete the post
      const { error: postError } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", postId);

      if (postError) {
        console.error("Error deleting post:", postError);
        toast.error("Failed to delete post");
        return;
      }

      toast.success("Post deleted successfully");
      refetch();
    } catch (error) {
      console.error("Error in delete operation:", error);
      toast.error("An error occurred while deleting the post");
    }
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
            refetch();
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

      <div className="flex items-center gap-4 mb-4">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Published Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts?.map((post) => (
            <TableRow key={post.id}>
              <TableCell>{post.title}</TableCell>
              <TableCell>
                {post.blog_post_categories?.[0]?.blog_categories?.name || 'Uncategorized'}
              </TableCell>
              <TableCell>
                <Badge variant={post.status === "published" ? "default" : "secondary"}>
                  {post.status}
                </Badge>
              </TableCell>
              <TableCell>
                {post.published_at 
                  ? new Date(post.published_at).toLocaleDateString()
                  : "Not published"}
              </TableCell>
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