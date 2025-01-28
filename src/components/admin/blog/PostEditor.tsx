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
  author_name: z.string().optional(),
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
      author_name: post?.author_name || "",
    },
  });

  useEffect(() => {
    console.log("Form isDirty:", form.formState.isDirty);
    console.log("Current form values:", form.getValues());
  }, [form.watch()]);

  const updatePostCategory = async (postId: string, categoryId: string | undefined) => {
    if (!categoryId) return;

    const { error: deleteError } = await supabase
      .from('blog_post_categories')
      .delete()
      .eq('post_id', postId);

    if (deleteError) {
      console.error("Error deleting existing categories:", deleteError);
      return;
    }

    const { error: insertError } = await supabase
      .from('blog_post_categories')
      .insert([{
        post_id: postId,
        category_id: categoryId
      }]);

    if (insertError) {
      console.error("Error inserting new category:", insertError);
    }
  };

  const updatePostTags = async (postId: string, tags: string[]) => {
    console.log("Updating tags for post:", postId, "with tags:", tags);
    
    try {
      // First, delete existing tags
      const { error: deleteError } = await supabase
        .from('blog_posts_tags')
        .delete()
        .eq('post_id', postId);

      if (deleteError) {
        console.error("Error deleting existing tags:", deleteError);
        throw deleteError;
      }

      // Process each tag
      for (const tagName of tags) {
        // Get or create the tag
        const { data: existingTags, error: tagError } = await supabase
          .from('blog_post_tags')
          .select('id')
          .eq('name', tagName)
          .limit(1);

        if (tagError) {
          console.error("Error checking existing tag:", tagError);
          continue;
        }

        let tagId;
        if (existingTags.length === 0) {
          // Create new tag
          const { data: newTag, error: createError } = await supabase
            .from('blog_post_tags')
            .insert([{
              name: tagName,
              slug: tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
            }])
            .select('id')
            .single();

          if (createError) {
            console.error("Error creating new tag:", createError);
            continue;
          }
          tagId = newTag.id;
        } else {
          tagId = existingTags[0].id;
        }

        // Insert the post-tag relationship
        const { error: relationError } = await supabase
          .from('blog_posts_tags')
          .insert([{
            post_id: postId,
            tag_id: tagId
          }]);

        if (relationError) {
          console.error("Error creating post-tag relationship:", relationError);
        }
      }
    } catch (error) {
      console.error("Error in updatePostTags:", error);
      throw error;
    }
  };

  const onSubmit = async (data: PostFormValues) => {
    console.log("Form submission started with data:", data);
    setIsSubmitting(true);
    try {
      console.log("Preparing Supabase request...");
      
      let slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      if (post?.id && slug === post.slug) {
        slug = post.slug;
      }

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) {
        toast.error("You must be logged in to save a post");
        return;
      }

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
        published_at: data.status === 'published' ? (data.published_at || new Date().toISOString()) : null,
        updated_at: new Date().toISOString(),
        author_name: data.author_name,
        author_id: session.session.user.id
      };
      
      console.log("Update data being sent:", updateData);
      
      const { data: responseData, error } = post?.id 
        ? await supabase
            .from('blog_posts')
            .update(updateData)
            .eq('id', post.id)
            .select()
        : await supabase
            .from('blog_posts')
            .insert([updateData])
            .select();

      console.log("Supabase response:", responseData);
      
      if (error) {
        console.error("Error saving post:", error);
        toast.error("Failed to save post");
        return;
      }

      if (responseData && responseData[0]) {
        const postId = responseData[0].id;
        
        // Update category if provided
        if (data.category_id) {
          await updatePostCategory(postId, data.category_id);
        }
        
        // Update tags if provided
        if (data.tags && Array.isArray(data.tags)) {
          console.log("Updating tags:", data.tags);
          await updatePostTags(postId, data.tags);
        }
      }

      console.log("Post saved successfully");
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