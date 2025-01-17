import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ImportLinksProps {
  onComplete?: () => void;
}

export function ImportLinks({ onComplete }: ImportLinksProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('wordpress-import', {
        body: formData,
      });

      if (error) throw error;

      const { customLinks } = data;
      
      if (customLinks?.length > 0) {
        let successCount = 0;
        let errorCount = 0;
        const total = customLinks.length;

        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error("User not authenticated");

        for (const [index, link] of customLinks.entries()) {
          try {
            // Create smart link
            const { data: smartLinkData, error: linkError } = await supabase
              .from('smart_links')
              .insert({
                user_id: userData.user.id,
                title: link.title,
                artist_name: link.author || 'Unknown Artist'
              })
              .select()
              .single();

            if (linkError) throw linkError;

            if (smartLinkData) {
              // Add platform links
              for (const platform of link.platforms) {
                const { error: platformError } = await supabase
                  .from('platform_links')
                  .insert({
                    smart_link_id: smartLinkData.id,
                    platform_id: platform.platform,
                    platform_name: platform.platform,
                    url: platform.url
                  });

                if (platformError) throw platformError;
              }

              // Import stats if available
              if (link.stats) {
                // Add views
                for (let i = 0; i < link.stats.views; i++) {
                  await supabase
                    .from('link_views')
                    .insert({
                      smart_link_id: smartLinkData.id,
                      viewed_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
                    });
                }

                // Add clicks
                for (let i = 0; i < link.stats.clicks; i++) {
                  await supabase
                    .from('platform_clicks')
                    .insert({
                      platform_link_id: smartLinkData.id,
                      clicked_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
                    });
                }
              }

              successCount++;
            }
          } catch (error) {
            console.error("Error importing link:", error);
            errorCount++;
          }
          setProgress((index + 1) / total * 100);
        }

        if (successCount > 0) {
          toast.success(`Successfully imported ${successCount} custom links`);
          if (onComplete) onComplete();
        }
        if (errorCount > 0) {
          toast.error(`Failed to import ${errorCount} custom links`);
        }
      }
    } catch (error) {
      console.error("Error importing custom links:", error);
      toast.error("Failed to import custom links");
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
            Importing custom links... {Math.round(progress)}%
          </p>
        </div>
      )}
    </div>
  );
}