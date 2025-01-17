import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { PostContent } from "./PostContent";
import { PostSettings } from "./PostSettings";
import { PostActions } from "./PostActions";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  meta_description: z.string().optional(),
  meta_keywords: z.string().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  category_id: z.string().optional(),
  visibility: z.enum(["public", "private", "password"]).default("public"),
  password: z.string().optional(),
  published_at: z.date().optional(),
  scheduled_for: z.date().optional(),
  allow_comments: z.boolean().default(true),
  is_sticky: z.boolean().default(false),
  format: z.enum(["standard", "gallery", "video", "audio"]).default("standard"),
  seo_title: z.string().optional(),
  focus_keyword: z.string().optional(),
});

export type PostFormValues = z.infer<typeof formSchema>;

interface PostEditorProps {
  post?: PostFormValues & { id: string };
  onClose: () => void;
}

export function PostEditor({ post, onClose }: PostEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<PostFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: post || {
      title: "",
      content: "",
      excerpt: "",
      meta_description: "",
      meta_keywords: "",
      status: "draft",
      visibility: "public",
      allow_comments: true,
      is_sticky: false,
      format: "standard",
      published_at: undefined,
    },
  });

  const createSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  async function onSubmit(values: PostFormValues) {
    setIsSubmitting(true);
    try {
      const user = await supabase.auth.getUser();
      const postData = {
        title: values.title,
        content: values.content,
        excerpt: values.excerpt,
        meta_description: values.meta_description,
        meta_keywords: values.meta_keywords,
        status: values.status,
        slug: createSlug(values.title),
        visibility: values.visibility,
        password: values.password,
        published_at: values.status === 'published' ? (values.published_at || new Date()).toISOString() : null,
        scheduled_for: values.scheduled_for?.toISOString(),
        allow_comments: values.allow_comments,
        is_sticky: values.is_sticky,
        format: values.format,
        seo_title: values.seo_title,
        focus_keyword: values.focus_keyword,
        author_id: user.data.user?.id,
      };

      if (post) {
        const { error: postError } = await supabase
          .from("blog_posts")
          .update(postData)
          .eq("id", post.id);

        if (postError) throw postError;

        if (values.category_id) {
          await supabase
            .from("blog_post_categories")
            .delete()
            .eq("post_id", post.id);

          await supabase
            .from("blog_post_categories")
            .insert({ post_id: post.id, category_id: values.category_id });
        }

        toast.success(
          values.status === "published" 
            ? "Post published successfully" 
            : "Post updated successfully"
        );
      } else {
        const { data: newPost, error: postError } = await supabase
          .from("blog_posts")
          .insert(postData)
          .select()
          .single();

        if (postError) throw postError;

        if (values.category_id && newPost) {
          await supabase
            .from("blog_post_categories")
            .insert({ post_id: newPost.id, category_id: values.category_id });
        }

        toast.success(
          values.status === "published" 
            ? "Post published successfully" 
            : "Post saved as draft"
        );
      }

      queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
      onClose();
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("Failed to save post. Please check all required fields.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <PostActions 
          isSubmitting={isSubmitting}
          onClose={onClose}
          isEditing={!!post}
        />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <PostContent form={form} />
          </div>
          <div>
            <PostSettings form={form} />
          </div>
        </div>
      </form>
    </Form>
  );
}