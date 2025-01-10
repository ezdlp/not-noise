import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  meta_description: z.string().optional(),
  meta_keywords: z.string().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
});

type PostFormValues = z.infer<typeof formSchema>;

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
      };

      const { error } = post
        ? await supabase
            .from("blog_posts")
            .update(postData)
            .eq("id", post.id)
        : await supabase.from("blog_posts").insert({
            ...postData,
            author_id: user.data.user?.id,
          });

      if (error) throw error;

      toast.success(post ? "Post updated successfully" : "Post created successfully");
      queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
      onClose();
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("Failed to save post");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Post title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write your post content here..."
                  className="min-h-[300px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="excerpt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Excerpt</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief excerpt of your post..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : (post ? "Update" : "Create")}
          </Button>
        </div>
      </form>
    </Form>
  );
}