import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { PostContent } from "./PostContent";
import { PostSettings } from "./PostSettings";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const postSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  featured_image: z.string().optional(),
  status: z.string().optional(),
  category_id: z.string().optional(),
  seo_title: z.string().optional(),
  meta_description: z.string().optional(),
  focus_keyword: z.string().optional(),
  published_at: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type PostFormValues = z.infer<typeof postSchema>;

interface PostEditorProps {
  post?: any;
  onClose: () => void;
}

export function PostEditor({ post, onClose }: PostEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      id: post?.id || undefined,
      title: post?.title || "",
      content: post?.content || "",
      slug: post?.slug || "",
      excerpt: post?.excerpt || "",
      featured_image: post?.featured_image || "",
      status: post?.status || "draft",
      category_id: post?.category_id || undefined,
      seo_title: post?.seo_title || "",
      meta_description: post?.meta_description || "",
      focus_keyword: post?.focus_keyword || "",
      published_at: post?.published_at || new Date().toISOString(),
      tags: post?.blog_posts_tags?.map((t: any) => t.blog_post_tags.name) || [],
    },
  });

  const calculateReadingTime = (content: string): number => {
    const wordsPerMinute = 200;
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const onSubmit = async (data: PostFormValues) => {
    setIsSubmitting(true);
    try {
      let slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      if (post?.id && slug === post.slug) {
        slug = post.slug;
      }

      const readingTime = calculateReadingTime(data.content);

      const updateData = {
        title: data.title,
        content: data.content,
        slug,
        excerpt: data.excerpt,
        featured_image: data.featured_image,
        status: data.status,
        seo_title: data.seo_title,
        meta_description: data.meta_description,
        focus_keyword: data.focus_keyword,
        published_at: data.published_at,
        reading_time: readingTime,
        updated_at: new Date().toISOString(),
      };
      
      const { data: responseData, error } = post?.id 
        ? await supabase
            .from('blog_posts')
            .update(updateData)
            .eq('id', post.id)
            .select()
        : await supabase
            .from('blog_posts')
            .insert([{
              ...updateData,
            }])
            .select();

      if (error) {
        console.error("Error saving post:", error);
        toast.error("Failed to save post");
        return;
      }

      if (responseData && responseData[0]) {
        await updatePostCategory(responseData[0].id, data.category_id);
        if (data.tags && data.tags.length > 0) {
          await updatePostTags(responseData[0].id, data.tags);
        }
      }

      toast.success(post?.id ? "Post updated" : "Post created");
      onClose();
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostUpdate = (key: string, value: any) => {
    console.log("Updating post field:", key, "with value:", value);
    form.setValue(key as any, value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8">
          <PostContent form={form} />
          <PostSettings 
            post={form.getValues()} 
            onUpdate={handlePostUpdate}
            onClose={onClose}
            isSubmitting={isSubmitting}
            isEditing={!!post?.id}
          />
        </div>
      </form>
    </Form>
  );
}
