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
import { TablesInsert } from "@/integrations/supabase/types";

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  title?: string;
  alt?: string;
  caption?: string;
  description?: string;
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
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>WordPress Import Review</DialogTitle>
          <DialogDescription>
            Please review the media files referenced in your WordPress export.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Media Files ({mediaItems.length})</h3>
            <ScrollArea className="h-[200px] border rounded-md p-4">
              {mediaItems.map((item) => (
                <div key={item.id} className="py-2 border-b last:border-0">
                  <p className="font-medium">{item.filename}</p>
                  {item.alt && <p className="text-sm text-muted-foreground">Alt: {item.alt}</p>}
                  {item.caption && <p className="text-sm text-muted-foreground">Caption: {item.caption}</p>}
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
            <h3 className="font-medium">Media File Handling</h3>
            <RadioGroup value={duplicateStrategy} onValueChange={(value: 'skip' | 'overwrite' | 'rename') => setDuplicateStrategy(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="skip" id="skip" />
                <Label htmlFor="skip">Skip existing files</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="overwrite" id="overwrite" />
                <Label htmlFor="overwrite">Overwrite existing files</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rename" id="rename" />
                <Label htmlFor="rename">Rename new files</Label>
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
  const [importedPosts, setImportedPosts] = useState<any[]>([]);
  const queryClient = useQueryClient();

  const handleWordPressImport = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsImporting(true);
      const { data, error } = await supabase.functions.invoke('wordpress-import', {
        body: formData,
      });

      if (error) throw error;

      const { posts, mediaItems, missingMedia } = data;
      setImportedPosts(posts);
      
      if (mediaItems?.length > 0) {
        setMediaItems(mediaItems);
        setMissingMedia(missingMedia || []);
        setShowMediaDialog(true);
      } else {
        await importPosts(posts);
      }
    } catch (error) {
      console.error('WordPress import error:', error);
      toast.error('Failed to process WordPress file');
    } finally {
      setIsImporting(false);
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

          let { data: existingPost } = await supabase
            .from("blog_posts")
            .select("slug")
            .eq("slug", baseSlug)
            .single();

          const slug = existingPost ? await createUniqueSlug(baseSlug) : baseSlug;

          const postData: TablesInsert<"blog_posts"> = {
            content: post.content,
            excerpt: post.excerpt || null,
            status: post.status || "draft",
            slug: slug,
            author_id: user.data.user.id,
            published_at: post.post_date ? new Date(post.post_date).toISOString() : null,
            created_at: post.post_date ? new Date(post.post_date).toISOString() : new Date().toISOString(),
            updated_at: new Date().toISOString(),
            featured_image: post.featured_image || null,
            visibility: "public",
            title: post.title,
            allow_comments: true,
            is_featured: false,
            is_sticky: false,
            format: "standard",
          };

          const { error: postError } = await supabase
            .from("blog_posts")
            .insert(postData);

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
      console.error("Error importing posts:", error);
      toast.error("Failed to import posts");
    } finally {
      setIsImporting(false);
      setProgress(0);
      setShowMediaDialog(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.xml')) {
      await handleWordPressImport(file);
    } else {
      toast.error('Please upload a valid WordPress XML export file');
    }
    event.target.value = '';
  };

  return (
    <>
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

      {showMediaDialog && (
        <ImportDialog
          mediaItems={mediaItems}
          missingMedia={missingMedia}
          onClose={() => {
            setShowMediaDialog(false);
            importPosts(importedPosts);
          }}
          onConfirm={(strategy) => {
            setShowMediaDialog(false);
            importPosts(importedPosts);
          }}
        />
      )}
    </>
  );
}