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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface MediaItem {
  id: string;
  url: string;
  title?: string;
  alt?: string;
  caption?: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface ImportDialogProps {
  mediaItems: MediaItem[];
  missingMedia: string[];
  onClose: () => void;
  onConfirm: (duplicateStrategy: 'skip' | 'overwrite' | 'rename') => void;
}

function ImportDialog({ mediaItems, missingMedia, onClose, onConfirm }: ImportDialogProps) {
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'overwrite' | 'rename'>('skip');

  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>WordPress Media Import</DialogTitle>
        <DialogDescription>
          We found media files referenced in your WordPress export. Please review the details below.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Media Files ({mediaItems.length})</h3>
          <ScrollArea className="h-[200px] border rounded-md p-4">
            {mediaItems.map((item) => (
              <div key={item.id} className="py-2 border-b last:border-0">
                <p className="font-medium">{item.url.split('/').pop()}</p>
                {item.alt && <p className="text-sm text-muted-foreground">Alt: {item.alt}</p>}
                {item.title && <p className="text-sm text-muted-foreground">Title: {item.title}</p>}
              </div>
            ))}
          </ScrollArea>
        </div>

        {missingMedia.length > 0 && (
          <div>
            <h3 className="font-medium mb-2 text-yellow-600">Missing Media ({missingMedia.length})</h3>
            <ScrollArea className="h-[100px] border rounded-md p-4">
              {missingMedia.map((url, index) => (
                <p key={index} className="text-sm text-yellow-600">{url}</p>
              ))}
            </ScrollArea>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="font-medium">Duplicate File Handling</h3>
          <RadioGroup value={duplicateStrategy} onValueChange={(value: 'skip' | 'overwrite' | 'rename') => setDuplicateStrategy(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="skip" id="skip" />
              <Label htmlFor="skip">Skip duplicate files</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="overwrite" id="overwrite" />
              <Label htmlFor="overwrite">Overwrite existing files</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="rename" id="rename" />
              <Label htmlFor="rename">Rename imported files</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onConfirm(duplicateStrategy)}>Continue Import</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
}

export function ImportPosts() {
  const [isImporting, setIsImporting] = useState(false);
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [missingMedia, setMissingMedia] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const queryClient = useQueryClient();

  const handleWordPressImport = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data, error } = await supabase.functions.invoke('wordpress-import', {
        body: formData,
      });

      if (error) throw error;

      const { posts, mediaItems, missingMedia } = data;
      
      if (mediaItems?.length > 0) {
        setMediaItems(mediaItems);
        setMissingMedia(missingMedia || []);
        setShowMediaDialog(true);
        return posts;
      }

      await importPosts(posts);
    } catch (error) {
      console.error('WordPress import error:', error);
      toast.error('Failed to process WordPress file');
    }
  };

  const handleMediaImport = async (posts: any[], duplicateStrategy: 'skip' | 'overwrite' | 'rename') => {
    try {
      setIsImporting(true);
      let successCount = 0;
      let errorCount = 0;
      const total = mediaItems.length;

      for (const [index, item] of mediaItems.entries()) {
        try {
          const response = await fetch(item.url);
          if (!response.ok) throw new Error(`Failed to fetch ${item.url}`);

          const blob = await response.blob();
          const file = new File([blob], item.url.split('/').pop() || 'file', { type: blob.type });

          const filePath = `${crypto.randomUUID()}.${file.name.split('.').pop()}`;

          const { error: uploadError } = await supabase.storage
            .from('media-library')
            .upload(filePath, file, {
              contentType: file.type,
              upsert: duplicateStrategy === 'overwrite',
            });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('media-library')
            .getPublicUrl(filePath);

          // Update content in posts to use new URL
          posts = posts.map(post => ({
            ...post,
            content: post.content.replace(item.url, publicUrl)
          }));

          successCount++;
        } catch (error) {
          console.error(`Error importing media ${item.url}:`, error);
          errorCount++;
        }
        setProgress((index + 1) / total * 100);
      }

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} media files`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} media files`);
      }

      await importPosts(posts);
    } catch (error) {
      console.error('Error importing media:', error);
      toast.error('Failed to import media files');
    } finally {
      setIsImporting(false);
      setProgress(0);
      setShowMediaDialog(false);
    }
  };

  const createUniqueSlug = async (baseSlug: string): Promise<string> => {
    const timestamp = Date.now();
    const uniqueSlug = `${baseSlug}-${timestamp}`;
    
    const { data } = await supabase
      .from("blog_posts")
      .select("slug")
      .eq("slug", uniqueSlug)
      .single();
    
    if (data) {
      // If still duplicate (very unlikely), try again with a different timestamp
      return createUniqueSlug(baseSlug);
    }
    
    return uniqueSlug;
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
          let baseSlug = post.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

          // Try to use the base slug first
          let { data: existingPost } = await supabase
            .from("blog_posts")
            .select("slug")
            .eq("slug", baseSlug)
            .single();

          // If slug exists, create a unique one
          const slug = existingPost ? await createUniqueSlug(baseSlug) : baseSlug;

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
      const posts = await handleWordPressImport(file);
      if (posts) {
        setShowMediaDialog(true);
      }
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

      {showMediaDialog && (
        <ImportDialog
          mediaItems={mediaItems}
          missingMedia={missingMedia}
          onClose={() => setShowMediaDialog(false)}
          onConfirm={(strategy) => handleMediaImport([], strategy)}
        />
      )}
    </>
  );
}
