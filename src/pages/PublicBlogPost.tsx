import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from "react-helmet";
import { Calendar, Clock, Share2, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";

const PublicBlogPost = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['public-post', slug],
    queryFn: async () => {
      console.log('Fetching post with slug:', slug);
      
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          author:profiles(*),
          blog_posts_tags (
            tag:blog_post_tags(*)
          ),
          blog_post_categories (
            category:blog_categories(*)
          )
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (error) {
        console.error('Error fetching post:', error);
        throw error;
      }
      
      if (!posts) {
        console.log('No post found with slug:', slug);
        throw new Error('Post not found');
      }
      
      console.log('Successfully fetched post:', posts);
      return posts;
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const isPage = post?.blog_post_categories?.some(
    pc => pc.category.name.toLowerCase() === 'page'
  );

  const { data: relatedPosts } = useQuery({
    queryKey: ['related-posts', post?.id],
    enabled: !!post?.id && !isPage,
    queryFn: async () => {
      const tags = post.blog_posts_tags?.map(pt => pt.tag.id) || [];
      
      if (tags.length === 0) {
        console.log('No tags found for related posts query');
        return [];
      }

      const { data: relatedByTags } = await supabase
        .from('blog_posts')
        .select(`
          *,
          blog_posts_tags (
            tag:blog_post_tags(*)
          )
        `)
        .neq('id', post.id)
        .eq('status', 'published')
        .in('blog_posts_tags.tag_id', tags)
        .limit(3);

      const tagRelatedPosts = relatedByTags || [];

      if (tagRelatedPosts.length < 3) {
        const excludeIds = [post.id, ...tagRelatedPosts.map(p => p.id)];
        const { data: recentPosts } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('status', 'published')
          .not('id', 'in', `(${excludeIds.join(',')})`)
          .order('published_at', { ascending: false })
          .limit(3 - tagRelatedPosts.length);

        return [...tagRelatedPosts, ...(recentPosts || [])];
      }

      return tagRelatedPosts;
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
        <p className="text-gray-600 mt-2">
          {error ? 'Please try again later.' : 'The requested post could not be found.'}
        </p>
      </div>
    );
  }

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = post?.title || '';
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this post: ${url}`)}`
    };

    window.open(shareUrls[platform as keyof typeof shareUrls], '_blank');
  };

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  const readingTime = calculateReadingTime(post.content);
  const authorName = post.author_name || post.author?.name || 'Unknown author';

  return (
    <>
      <Helmet>
        <title>{post.seo_title || post.title}</title>
        <meta name="description" content={post.meta_description || post.excerpt || ''} />
        <meta name="keywords" content={post.focus_keyword || ''} />
        <meta property="og:title" content={post.seo_title || post.title} />
        <meta property="og:description" content={post.meta_description || post.excerpt || ''} />
        {post.featured_image && (
          <meta property="og:image" content={post.featured_image} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.seo_title || post.title} />
        <meta name="twitter:description" content={post.meta_description || post.excerpt || ''} />
        {post.featured_image && (
          <meta name="twitter:image" content={post.featured_image} />
        )}
      </Helmet>
      
      <article className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-6">{post.title}</h1>
        
        {!isPage && (
          <>
            <div className="flex flex-wrap items-center gap-6 text-muted-foreground mb-8">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {post.published_at ? format(new Date(post.published_at), 'MMM d, yyyy') : 'Draft'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="text-sm">{authorName}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{readingTime} min read</span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleShare('twitter')}>
                    Share on X (Twitter)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('facebook')}>
                    Share on Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('linkedin')}>
                    Share on LinkedIn
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
                    Share on WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('email')}>
                    Share via Email
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {post.featured_image && (
              <img
                src={post.featured_image}
                alt={post.title}
                className="w-full h-[400px] object-cover rounded-lg mb-12"
              />
            )}
          </>
        )}

        <div 
          className="prose prose-lg max-w-none mb-12 [&_img]:my-8 [&_p]:leading-relaxed [&_h2]:mt-12 [&_h3]:mt-8"
          dangerouslySetInnerHTML={{ __html: post.content }} 
        />

        {!isPage && relatedPosts && relatedPosts.length > 0 && (
          <section className="border-t pt-12 mt-12">
            <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost: any) => (
                <Card key={relatedPost.id} className="hover:shadow-md transition-shadow">
                  <a href={`/${relatedPost.slug}`} className="block p-4">
                    {relatedPost.featured_image && (
                      <img
                        src={relatedPost.featured_image}
                        alt={relatedPost.title}
                        className="w-full h-48 object-cover rounded-md mb-4"
                      />
                    )}
                    <h3 className="font-bold mb-2 line-clamp-2">{relatedPost.title}</h3>
                    {relatedPost.excerpt && (
                      <p className="text-muted-foreground text-sm line-clamp-3">
                        {relatedPost.excerpt}
                      </p>
                    )}
                  </a>
                </Card>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
};

export default PublicBlogPost;