
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BlogCard } from "@/components/blog/BlogCard";
import { Skeleton } from "@/components/ui/skeleton";
import { BlogSEO } from "@/components/seo/BlogSEO";

export default function Blog() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data: blogCategory } = await supabase
        .from("blog_categories")
        .select("id")
        .eq("name", "Blog")
        .single();

      if (!blogCategory) {
        console.error("Blog category not found");
        return [];
      }

      const { data, error } = await supabase
        .from("blog_posts")
        .select(`
          *,
          blog_post_categories!inner (
            category_id
          )
        `)
        .eq("status", "published")
        .eq("blog_post_categories.category_id", blogCategory.id)
        .order("published_at", { ascending: false });

      if (error) {
        console.error("Error fetching blog posts:", error);
        throw error;
      }

      return data;
    },
  });

  return (
    <>
      <BlogSEO />
      <div className="container py-12 px-4 mx-auto">
        <h1 className="text-4xl font-bold mb-8">Blog</h1>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="space-y-4">
                <Skeleton className="w-full h-[200px]" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : posts?.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No blog posts found.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts?.map((post) => (
              <BlogCard
                key={post.id}
                title={post.title}
                featuredImage={post.featured_image}
                publishedAt={post.published_at}
                slug={post.slug}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
