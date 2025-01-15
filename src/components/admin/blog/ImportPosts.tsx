import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function ImportPosts() {
  const [isImporting, setIsImporting] = useState(false);
  const queryClient = useQueryClient();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const text = await file.text();
      const posts = JSON.parse(text);

      if (!Array.isArray(posts)) {
        throw new Error("Invalid file format. Expected an array of posts.");
      }

      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error("User not authenticated");

      let successCount = 0;
      let errorCount = 0;

      for (const post of posts) {
        try {
          const slug = post.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

          const { error: postError } = await supabase
            .from("blog_posts")
            .insert({
              title: post.title,
              content: post.content,
              excerpt: post.excerpt,
              meta_description: post.meta_description,
              meta_keywords: post.meta_keywords,
              status: post.status || "draft",
              slug: slug,
              visibility: post.visibility || "public",
              author_id: user.data.user.id,
              featured_image: post.featured_image,
              cover_image: post.cover_image,
              is_featured: post.is_featured || false,
              allow_comments: post.allow_comments ?? true,
              is_sticky: post.is_sticky || false,
              format: post.format || "standard",
              seo_title: post.seo_title,
              focus_keyword: post.focus_keyword,
            });

          if (postError) throw postError;
          successCount++;
        } catch (error) {
          console.error("Error importing post:", error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} posts`);
        queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
      }
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} posts`);
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      toast.error("Failed to parse import file");
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        disabled={isImporting}
        className="max-w-[300px]"
      />
      <Button disabled={isImporting} variant="outline" size="icon">
        <Upload className="h-4 w-4" />
      </Button>
    </div>
  );
}