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

  const onSubmit = async (data: PostFormValues) => {
    console.log("Form submission started with data:", data);
    setIsSubmitting(true);
    try {
      console.log("Preparing Supabase request...");
      
      let slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      // If we're updating and the slug hasn't changed, use the existing slug
      if (post?.id && slug === post.slug) {
        slug = post.slug;
      }

      const updateData = {
        title: data.title,
        content: data.content,
        slug,
        excerpt: data.excerpt,
        featured_image: data.featured_image,
        status: data.status,
        updated_at: new Date().toISOString(),
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
            .insert([{
              ...updateData,
              author_id: (await supabase.auth.getUser()).data.user?.id,
            }])
            .select();

      console.log("Supabase complete response:", responseData);
      console.log("Supabase response error:", error);
      
      if (error) {
        console.error("Error saving post:", error);
        toast.error("Failed to save post");
        return;
      }

      // Update category after successful post save
      if (responseData && responseData[0]) {
        await updatePostCategory(responseData[0].id, data.category_id);
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