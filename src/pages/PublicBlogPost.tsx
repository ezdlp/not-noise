import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from "react-helmet";

const PublicBlogPost = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['public-post', slug],
    queryFn: async () => {
      console.log('Fetching post with slug:', slug);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) {
        console.error('Error fetching post:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Post not found');
      }

      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-red-500">
          {error ? 'Error loading post' : 'Post not found'}
        </h1>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.seo_title || post.title}</title>
        <meta name="description" content={post.meta_description || post.excerpt || ''} />
        <meta name="keywords" content={post.focus_keyword || ''} />
        
        {/* Open Graph tags */}
        <meta property="og:title" content={post.seo_title || post.title} />
        <meta property="og:description" content={post.meta_description || post.excerpt || ''} />
        {post.featured_image && (
          <meta property="og:image" content={post.featured_image} />
        )}
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.seo_title || post.title} />
        <meta name="twitter:description" content={post.meta_description || post.excerpt || ''} />
        {post.featured_image && (
          <meta name="twitter:image" content={post.featured_image} />
        )}
      </Helmet>
      
      <article className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        {post.featured_image && (
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full h-[400px] object-cover rounded-lg mb-8"
          />
        )}
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
    </>
  );
};

export default PublicBlogPost;