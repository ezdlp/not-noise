
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BlogCard } from "@/components/blog/BlogCard";
import { Skeleton } from "@/components/ui/skeleton";
import { BlogSEO } from "@/components/seo/BlogSEO";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  featured_image?: string;
  published_at: string;
}

export default function Blog() {
  const navigate = useNavigate();
  const { page } = useParams();
  const currentPage = page ? parseInt(page) : 1;
  const postsPerPage = 12;

  const { data, isLoading } = useQuery({
    queryKey: ["blog-posts", currentPage],
    queryFn: async () => {
      // Get total count of blog posts (only Blog category)
      const { count, error: countError } = await supabase
        .from("blog_posts")
        .select(`
          id,
          blog_post_categories!inner (
            category:blog_categories!inner (
              name
            )
          )
        `, { 
          count: "exact",
          head: true 
        })
        .eq("status", "published")
        .eq("blog_post_categories.category.name", "Blog");

      if (countError) {
        console.error("Error fetching blog posts count:", countError);
        throw countError;
      }

      // Calculate pagination
      const from = (currentPage - 1) * postsPerPage;
      const to = from + postsPerPage - 1;

      // Fetch paginated blog posts
      const { data: posts, error } = await supabase
        .from("blog_posts")
        .select(`
          id,
          title,
          slug,
          featured_image,
          published_at,
          blog_post_categories!inner (
            category:blog_categories!inner (
              name
            )
          )
        `)
        .eq("status", "published")
        .eq("blog_post_categories.category.name", "Blog")
        .order("published_at", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Error fetching blog posts:", error);
        throw error;
      }

      return {
        posts: posts as BlogPost[],
        total: count || 0
      };
    },
    retry: 1,
  });

  const totalPages = data ? Math.ceil(data.total / postsPerPage) : 0;

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    navigate(newPage === 1 ? "/blog" : `/blog/page/${newPage}`);
  };

  return (
    <>
      <BlogSEO 
        currentPage={currentPage}
        totalPages={totalPages}
      />
      
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
        ) : data?.posts.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No blog posts found.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {data?.posts.map((post) => (
                <BlogCard
                  key={post.id}
                  title={post.title}
                  featuredImage={post.featured_image}
                  publishedAt={post.published_at}
                  slug={post.slug}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-2 mx-4">
                  {[...Array(totalPages)].map((_, i) => (
                    <Button
                      key={i + 1}
                      variant={currentPage === i + 1 ? "default" : "outline"}
                      onClick={() => handlePageChange(i + 1)}
                      className="w-10 h-10 p-0"
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
