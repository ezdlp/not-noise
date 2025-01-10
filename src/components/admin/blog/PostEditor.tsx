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
import { CategorySelect } from "./CategorySelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  scheduled_for: z.date().optional(),
  allow_comments: z.boolean().default(true),
  is_sticky: z.boolean().default(false),
  format: z.enum(["standard", "gallery", "video", "audio"]).default("standard"),
  seo_title: z.string().optional(),
  focus_keyword: z.string().optional(),
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
      visibility: "public",
      allow_comments: true,
      is_sticky: false,
      format: "standard",
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
        scheduled_for: values.scheduled_for?.toISOString(),
        allow_comments: values.allow_comments,
        is_sticky: values.is_sticky,
        format: values.format,
        seo_title: values.seo_title,
        focus_keyword: values.focus_keyword,
        author_id: user.data.user?.id,
      };

      if (post) {
        // Update existing post
        const { error: postError } = await supabase
          .from("blog_posts")
          .update(postData)
          .eq("id", post.id);

        if (postError) throw postError;

        if (values.category_id) {
          // Update category
          await supabase
            .from("blog_post_categories")
            .delete()
            .eq("post_id", post.id);

          await supabase
            .from("blog_post_categories")
            .insert({ post_id: post.id, category_id: values.category_id });
        }
      } else {
        // Create new post
        const { data: newPost, error: postError } = await supabase
          .from("blog_posts")
          .insert(postData)
          .select()
          .single();

        if (postError) throw postError;

        if (values.category_id && newPost) {
          // Insert category
          await supabase
            .from("blog_post_categories")
            .insert({ post_id: newPost.id, category_id: values.category_id });
        }
      }

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
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
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
          </div>

          <div className="space-y-6">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <CategorySelect
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="password">Password Protected</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("visibility") === "password" && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="scheduled_for"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Schedule Publication</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date()
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

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