import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";

interface ImportMediaProps {
  onComplete?: () => void;
}

export function ImportMedia({ onComplete }: ImportMediaProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importedFiles, setImportedFiles] = useState<string[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    setIsImporting(true);
    setProgress(0);
    const newImportedFiles: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = `${crypto.randomUUID()}.${file.name.split('.').pop()}`;

        const { error: uploadError } = await supabase.storage
          .from('media-library')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('media-library')
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from('media_files')
          .insert({
            filename: file.name,
            file_path: filePath,
            mime_type: file.type,
            size: file.size,
          });

        if (dbError) throw dbError;

        newImportedFiles.push(file.name);
        setProgress(((i + 1) / files.length) * 100);
      }

      setImportedFiles(prev => [...prev, ...newImportedFiles]);
      toast.success(`Successfully imported ${files.length} files`);
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error importing media:', error);
      toast.error('Failed to import media files');
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept="image/*,video/*,audio/*"
          onChange={handleFileUpload}
          disabled={isImporting}
          multiple
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
            Importing media files... {Math.round(progress)}%
          </p>
        </div>
      )}

      {importedFiles.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Imported Files</h3>
          <ScrollArea className="h-[200px] border rounded-md p-4">
            {importedFiles.map((filename, index) => (
              <p key={index} className="text-sm py-1">
                {filename}
              </p>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}