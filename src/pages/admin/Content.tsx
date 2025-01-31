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

export default function Content() {
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
          blog_post_categories (
            blog_categories (
              id,
              name
            )
          ),
          blog_posts_tags (
            blog_post_tags (
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
      console.log("Fetched posts with tags:", data);

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

  const getContentType = (post: any) => {
    if (!post.blog_post_categories?.length) {
      return "Undefined";
    }
    return post.blog_post_categories[0]?.blog_categories?.name === "Page" ? "Page" : "Blog Post";
  };

  const getContentTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "Page":
        return "bg-primary-light text-primary hover:bg-primary-light/90";
      case "Blog Post":
        return "bg-[#A299FC] text-white hover:bg-[#A299FC]/90";
      default:
        return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === "published" 
      ? "bg-success text-white hover:bg-success-hover"
      : "bg-[#E6E6E6] text-[#666666] hover:bg-[#E6E6E6]/90";
  };

  if (isLoading) return <div>Loading...</div>;

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-night">
              {selectedPost ? "Edit Content" : "Create New Content"}
            </h1>
            <p className="text-[#666666]">
              {selectedPost ? "Make changes to your content." : "Create new content."}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              setIsEditing(false);
              setSelectedPost(null);
            }}
            className="border-[#E6E6E6] text-[#666666] hover:bg-[#FAFAFA] hover:text-night"
          >
            Back to Content
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
          <h1 className="text-3xl font-bold tracking-tight text-night">Content</h1>
          <p className="text-[#666666]">Manage your content, including pages and blog posts.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline"
            onClick={() => {}} 
            className="border-[#E6E6E6] text-[#666666] hover:bg-[#FAFAFA] hover:text-night"
          >
            <ImportPosts />
          </Button>
          <Button onClick={() => setIsEditing(true)} className="bg-primary hover:bg-primary-hover">
            <FileText className="mr-2 h-4 w-4" />
            Add New Content
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px] border-[#E6E6E6] text-[#666666] hover:border-primary">
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

      <div className="rounded-md border border-[#E6E6E6]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-[#FAFAFA]">
              <TableHead className="text-night font-medium">Title</TableHead>
              <TableHead className="text-night font-medium">Type</TableHead>
              <TableHead className="text-night font-medium">Status</TableHead>
              <TableHead className="text-night font-medium">Published Date</TableHead>
              <TableHead className="text-night font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts?.map((post) => {
              const contentType = getContentType(post);
              return (
                <TableRow key={post.id} className="hover:bg-[#ECE9FF]">
                  <TableCell className="font-medium text-night">{post.title}</TableCell>
                  <TableCell>
                    <Badge className={getContentTypeBadgeVariant(contentType)}>
                      {contentType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeVariant(post.status)}>
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[#666666]">
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
                      className="text-night hover:text-primary hover:bg-primary-light"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(post.id)}
                      className="text-night hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="text-night hover:text-primary hover:bg-primary-light"
                    >
                      <a href={`/${post.slug}`} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4" />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
