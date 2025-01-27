import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { PostContent } from "./PostContent";
import { PostSettings } from "./PostSettings";
import { PostActions } from "./PostActions";
import { isFuture, isPast } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SeoSection } from "./seo/SeoSection";
import debounce from "lodash/debounce";

export const formSchema = z.object({
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
  slug: z.string().optional(),
  featured_image: z.string().optional(),
});

export type PostFormValues = z.infer<typeof formSchema>;

export interface PostEditorProps {
  post?: PostFormValues & { id?: string };
  onClose: () => void;
}

export function PostEditor({ post, onClose }: PostEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const queryClient = useQueryClient();

  console.log("PostEditor rendered with post:", post);

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
      published_at: new Date(),
      slug: "",
      featured_image: "",
    },
  });

  const isDirty = form.formState.isDirty;
  console.log("Form isDirty:", isDirty);
  console.log("Current form values:", form.getValues());

  const createUniqueSlug = async (baseSlug: string, postId?: string): Promise<string> => {
    let slug = baseSlug;
    let counter = 1;
    let isUnique = false;

    while (!isUnique) {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;

      if (!data || (postId && data.id === postId)) {
        isUnique = true;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    return slug;
  };

  const createSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const debouncedUpdateSlug = debounce(async (title: string) => {
    if (!title) return;
    const baseSlug = createSlug(title);
    const uniqueSlug = await createUniqueSlug(baseSlug, post?.id);
    form.setValue('slug', uniqueSlug, { shouldDirty: true });
  }, 5000);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      console.log("Form value changed:", name, value);
      if (name === 'title') {
        debouncedUpdateSlug(value.title as string);
      }
    });
    return () => {
      subscription.unsubscribe?.();
      debouncedUpdateSlug.cancel();
    };
  }, [form.watch]);

  const handleClose = () => {
    console.log("Handle close triggered, isDirty:", isDirty);
    if (isDirty) {
      setShowUnsavedChangesDialog(true);
    } else {
      onClose();
    }
  };

  const handleSave = async (values: PostFormValues) => {
    console.log("handleSave called with values:", values);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Error getting user:", userError);
        throw userError;
      }
      
      console.log("Current user:", user);
      
      const now = new Date();
      const publishDate = values.published_at || now;
      
      let status = values.status;
      let scheduledFor = values.scheduled_for;
      
      if (isFuture(publishDate)) {
        status = 'draft';
        scheduledFor = publishDate;
      } else {
        status = 'published';
        scheduledFor = null;
      }

      const baseSlug = createSlug(values.title);
      const uniqueSlug = await createUniqueSlug(baseSlug, post?.id);

      const postData = {
        title: values.title,
        content: values.content,
        excerpt: values.excerpt,
        meta_description: values.meta_description,
        meta_keywords: values.meta_keywords,
        status: status,
        slug: uniqueSlug,
        visibility: values.visibility,
        password: values.password,
        published_at: publishDate.toISOString(),
        scheduled_for: scheduledFor?.toISOString(),
        allow_comments: values.allow_comments,
        is_sticky: values.is_sticky,
        format: values.format,
        seo_title: values.seo_title,
        focus_keyword: values.focus_keyword,
        author_id: user?.id,
        featured_image: values.featured_image,
      };

      console.log("Prepared post data:", postData);

      if (post?.id) {
        console.log("Updating existing post:", post.id);
        const { error: postError } = await supabase
          .from("blog_posts")
          .update(postData)
          .eq("id", post.id);

        if (postError) {
          console.error("Error updating post:", postError);
          throw postError;
        }

        console.log("Post updated successfully");

        if (values.category_id) {
          await supabase
            .from("blog_post_categories")
            .delete()
            .eq("post_id", post.id);

          await supabase
            .from("blog_post_categories")
            .insert({ post_id: post.id, category_id: values.category_id });
        }
      } else {
        console.log("Creating new post");
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
      }
    } catch (error) {
      console.error("Error saving post:", error);
      throw error;
    }
  };

  const onSubmit = async (values: PostFormValues) => {
    console.log("Form submitted with values:", values);
    setIsSubmitting(true);
    try {
      await handleSave(values);
      await queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
      
      const message = isFuture(values.published_at || new Date())
        ? `Post scheduled for ${values.published_at?.toLocaleDateString()} ${values.published_at?.toLocaleTimeString()}`
        : isPast(values.published_at || new Date())
        ? `Post backdated to ${values.published_at?.toLocaleDateString()} ${values.published_at?.toLocaleTimeString()}`
        : post?.id ? "Post updated successfully" : "Post published successfully";

      toast.success(message);
      onClose();
    } catch (error) {
      console.error("Error in onSubmit:", error);
      toast.error("Failed to save post. Please check all required fields.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex justify-between items-center sticky top-0 bg-background z-10 py-4 border-b">
            <PostActions 
              isSubmitting={isSubmitting}
              onClose={handleClose}
              isEditing={!!post}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <PostContent form={form} />
              <SeoSection
                title={form.watch('title')}
                content={form.watch('content')}
                focusKeyword={form.watch('focus_keyword') || ''}
                onFocusKeywordChange={(value) => form.setValue('focus_keyword', value)}
                seoTitle={form.watch('seo_title') || ''}
                onSeoTitleChange={(value) => form.setValue('seo_title', value)}
                metaDescription={form.watch('meta_description') || ''}
                onMetaDescriptionChange={(value) => form.setValue('meta_description', value)}
                ogTitle={form.watch('seo_title') || form.watch('title')}
                onOgTitleChange={(value) => form.setValue('seo_title', value)}
                ogDescription={form.watch('meta_description') || ''}
                onOgDescriptionChange={(value) => form.setValue('meta_description', value)}
                ogImage={''}
                onOgImageChange={() => {}}
                url={`${window.location.origin}/${form.watch('slug')}`}
              />
            </div>
            <div>
              <PostSettings 
                post={form.getValues()} 
                onUpdate={(key, value) => form.setValue(key as any, value, { shouldDirty: true })}
              />
            </div>
          </div>
        </form>
      </Form>

      <AlertDialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowUnsavedChangesDialog(false);
              onClose();
            }}>
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
