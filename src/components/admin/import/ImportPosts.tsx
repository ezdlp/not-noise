import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";

interface ImportPostsProps {
  onComplete?: () => void;
}

export function ImportPosts({ onComplete }: ImportPostsProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const queryClient = useQueryClient();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast.error("Please select a file to import");
      return;
    }

    if (!file.name.endsWith('.xml')) {
      toast.error('Please upload a valid WordPress XML export file');
      event.target.value = '';
      return;
    }

    try {
      setIsImporting(true);
      setProgress(10);
      console.log('Starting import process...');

      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('wordpress-import', {
        body: formData,
      });

      if (error) {
        console.error('Import error:', error);
        toast.error(`Import failed: ${error.message}`);
        return;
      }

      if (!data || !data.posts) {
        console.error('No data received from import');
        toast.error('No posts found in the import file');
        return;
      }

      console.log(`Processing ${data.posts.length} posts...`);
      setProgress(30);

      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        toast.error("User not authenticated");
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const total = data.posts.length;

      for (const [index, post] of data.posts.entries()) {
        try {
          console.log(`Importing post ${index + 1}/${total}: ${post.title}`);
          
          const slug = post.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') + 
            '-' + Date.now();

          const { error: postError } = await supabase
            .from("blog_posts")
            .insert({
              title: post.title,
              content: post.content,
              excerpt: post.excerpt,
              meta_description: post.meta_description,
              meta_keywords: post.meta_keywords,
              status: post.status || "draft",
              slug,
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
              published_at: post.published_at ? new Date(post.published_at).toISOString() : null,
            });

          if (postError) {
            console.error("Error importing post:", postError);
            throw postError;
          }
          
          successCount++;
          setProgress(30 + ((index + 1) / total * 70));
        } catch (error) {
          console.error("Error importing post:", error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} posts`);
        queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
        if (onComplete) onComplete();
      }
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} posts`);
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import posts. Please try again.");
    } finally {
      setIsImporting(false);
      setProgress(0);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept=".xml"
          onChange={handleFileUpload}
          disabled={isImporting}
          className="max-w-[300px]"
        />
        <Button disabled={isImporting} variant="outline" size="icon">
          <Upload className="h-4 w-4" />
        </Button>
      </div>

      {isImporting && (
        <div className="space-y-2">
          <Progress value={progress} className="w-[300px]" />
          <p className="text-sm text-muted-foreground">
            Importing posts... {Math.round(progress)}%
          </p>
        </div>
      )}
    </div>
  );
}