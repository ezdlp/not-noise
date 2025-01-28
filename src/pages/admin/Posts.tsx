import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PostEditor } from "@/components/admin/blog/PostEditor";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function Posts() {
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();

  const fetchPosts = async () => {
    try {
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

      if (error) {
        console.error("Error fetching posts:", error);
        return;
      }

      setPosts(data || []);
    } catch (error) {
      console.error("Error in fetchPosts:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching categories:", error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error("Error in fetchCategories:", error);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [selectedCategory]);

  const handleCreatePost = () => {
    setSelectedPost(null);
    setIsEditorOpen(true);
  };

  const handleEditPost = (post: any) => {
    setSelectedPost(post);
    setIsEditorOpen(true);
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", postId);

      if (error) {
        console.error("Error deleting post:", error);
        toast.error("Failed to delete post");
        return;
      }

      toast.success("Post deleted successfully");
      fetchPosts();
    } catch (error) {
      console.error("Error in handleDeletePost:", error);
      toast.error("An error occurred while deleting the post");
    }
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setSelectedPost(null);
    fetchPosts();
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Blog Posts</h1>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreatePost}>Create Post</Button>
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
          {posts.map((post) => (
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
                  size="sm"
                  onClick={() => handleEditPost(post)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeletePost(post.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Sheet open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <SheetContent side="right" className="w-full sm:w-[800px] sm:max-w-none">
          <PostEditor post={selectedPost} onClose={handleEditorClose} />
        </SheetContent>
      </Sheet>
    </div>
  );
}