import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

export function ImportPosts() {
  const [isImporting, setIsImporting] = useState(false);
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [mediaItems, setMediaItems] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const queryClient = useQueryClient();

  const handleWordPressImport = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(
        'https://owtufhdsuuyrgmxytclj.supabase.co/functions/v1/wordpress-import',
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error('Failed to process WordPress file');
      }

      const { posts, mediaItems } = await response.json();
      
      if (mediaItems?.length > 0) {
        setMediaItems(mediaItems);
        setShowMediaDialog(true);
      }

      await importPosts(posts);
    } catch (error) {
      console.error('WordPress import error:', error);
      toast.error('Failed to process WordPress file');
    }
  };

  const importPosts = async (posts: any[]) => {
    try {
      setIsImporting(true);
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error("User not authenticated");

      let successCount = 0;
      let errorCount = 0;
      const total = posts.length;

      for (const [index, post] of posts.entries()) {
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
          setProgress((index + 1) / total * 100);
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
      setProgress(0);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.xml')) {
      await handleWordPressImport(file);
    } else {
      try {
        const text = await file.text();
        const posts = JSON.parse(text);
        await importPosts(posts);
      } catch (error) {
        console.error("Error parsing file:", error);
        toast.error("Failed to parse import file");
      }
    }
    event.target.value = '';
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept=".json,.xml"
          onChange={handleFileUpload}
          disabled={isImporting}
          className="max-w-[300px]"
        />
        <Button disabled={isImporting} variant="outline" size="icon">
          <Upload className="h-4 w-4" />
        </Button>
      </div>

      {isImporting && (
        <div className="mt-4">
          <Progress value={progress} className="w-[300px]" />
        </div>
      )}

      <Dialog open={showMediaDialog} onOpenChange={setShowMediaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>WordPress Media Files</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The following media files were found in your WordPress export. You'll need to:
              1. Download these files from your WordPress site
              2. Upload them to your media library
              3. Update the URLs in your post content
            </p>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {mediaItems.map((url, index) => (
                <div key={index} className="text-sm">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    {url}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}