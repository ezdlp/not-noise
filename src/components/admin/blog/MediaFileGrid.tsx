import { Button } from "@/components/ui/button";
import { CheckCircle2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MediaFileGridProps {
  files: any[];
  isSelectionMode: boolean;
  selectedFiles: Set<string>;
  onSelect: (url: string) => void;
  onDelete: (id: string, filePath: string) => void;
  onToggleSelection: (id: string) => void;
}

export function MediaFileGrid({
  files,
  isSelectionMode,
  selectedFiles,
  onSelect,
  onDelete,
  onToggleSelection,
}: MediaFileGridProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {files?.map((file) => {
        const { data: { publicUrl } } = supabase.storage
          .from("media-library")
          .getPublicUrl(file.file_path);

        return (
          <div
            key={file.id}
            className={cn(
              "relative group border rounded-md p-2",
              isSelectionMode && "cursor-pointer",
              selectedFiles.has(file.id) && "ring-2 ring-primary"
            )}
            onClick={() => isSelectionMode ? onToggleSelection(file.id) : null}
          >
            <img
              src={publicUrl}
              alt={file.alt_text || file.filename}
              className="w-full h-32 object-cover rounded cursor-pointer"
              onClick={(e) => {
                if (!isSelectionMode) {
                  e.stopPropagation();
                  onSelect(publicUrl);
                }
              }}
            />
            {isSelectionMode && selectedFiles.has(file.id) && (
              <div className="absolute top-4 right-4">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
            )}
            {!isSelectionMode && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(file.id, file.file_path);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="mt-2 space-y-1">
              <p className="text-sm truncate">{file.filename}</p>
              <p className="text-xs text-muted-foreground">
                {file.dimensions ? `${file.dimensions.width}x${file.dimensions.height}` : ""}
                {file.size && ` • ${(file.size / 1024).toFixed(1)}KB`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}