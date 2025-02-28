
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { ArticleSEO } from "@/components/seo/ArticleSEO";
import { Footer } from "@/components/landing/Footer";

const PublicBlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(`
          *,
          blog_post_categories!inner (
            category:blog_categories(*)
          ),
          blog_posts_tags!inner (
            tag:blog_tags(*)
          )
        `)
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error) {
        console.error("Error fetching blog post:", error);
        
        // Check if this is a "No rows found" error, which means the post doesn't exist
        if (error.code === "PGRST116") {
          throw new Error("Post not found");
        }
        
        throw error;
      }

      return data;
    },
    retry: (count, error: any) => {
      // Don't retry if the post doesn't exist
      return error.message !== "Post not found" && count < 3;
    },
    onError: (error: any) => {
      if (error.message === "Post not found") {
        navigate("/blog", { replace: true });
      }
    }
  });

  if (isLoading) {
    return (
      <div className="container py-12 px-4 mx-auto">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/3 mb-8" />
        <Skeleton className="h-[300px] w-full mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return null; // We're redirecting in the onError callback, so no need to display anything
  }

  return (
    <>
      <ArticleSEO
        title={post.title}
        description={post.excerpt || ""}
        publishedTime={post.published_at}
        modifiedTime={post.updated_at}
        featuredImage={post.featured_image}
        slug={post.slug}
        tags={post.blog_posts_tags.map((tagRel: any) => tagRel.tag.name)}
      />
      
      <div className="container max-w-3xl py-12 px-4 mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
        
        <div className="text-muted-foreground mb-8">
          {post.published_at && (
            <time dateTime={post.published_at}>
              {format(new Date(post.published_at), "MMMM d, yyyy")}
            </time>
          )}
        </div>
        
        {post.featured_image && (
          <div className="mb-8">
            <img 
              src={post.featured_image} 
              alt={post.title}
              className="w-full h-auto rounded-lg shadow-md"
            />
          </div>
        )}
        
        <div 
          className="prose prose-sm sm:prose lg:prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        
        {post.blog_posts_tags && post.blog_posts_tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {post.blog_posts_tags.map((tagRel: any) => (
                <span 
                  key={tagRel.tag.id}
                  className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full"
                >
                  {tagRel.tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default PublicBlogPost;
