import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Grid3X3 } from "lucide-react";

interface RelatedPostsProps {
  currentPostId: string;
  categoryId?: string;
  tags?: string[];
}

export function RelatedPosts({ currentPostId, categoryId, tags }: RelatedPostsProps) {
  const { data: relatedPosts, isLoading } = useQuery({
    queryKey: ['related-posts', currentPostId, categoryId, tags],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select(`
          id,
          title,
          slug,
          excerpt,
          featured_image,
          reading_time
        `)
        .neq('id', currentPostId)
        .eq('status', 'published')
        .limit(3);

      if (categoryId) {
        query = query.eq('blog_post_categories.category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !relatedPosts?.length) return null;

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-6">
        <Grid3X3 className="w-5 h-5" />
        <h2 className="text-2xl font-bold">Related Posts</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {relatedPosts.map((post) => (
          <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {post.featured_image && (
              <img
                src={post.featured_image}
                alt={post.title}
                className="w-full h-48 object-cover"
              />
            )}
            <CardHeader className="p-4">
              <h3 className="text-lg font-semibold line-clamp-2">
                <a href={`/${post.slug}`} className="hover:text-primary">
                  {post.title}
                </a>
              </h3>
            </CardHeader>
            {post.excerpt && (
              <CardContent className="p-4 pt-0">
                <p className="text-muted-foreground text-sm line-clamp-2">
                  {post.excerpt}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}