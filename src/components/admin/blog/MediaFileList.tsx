import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Download, FileText, Image, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useMediaLibrary } from "./MediaLibraryContext";

interface MediaFileListProps {
  files: any[];
  onDelete: (id: string) => void;
  isSelectionMode?: boolean;
  onSelect?: (url: string) => void;
  showInsertButton?: boolean;
  selectedFiles: Set<string>;
}

export function MediaFileList({ 
  files, 
  onDelete, 
  isSelectionMode,
  onSelect,
  showInsertButton = true,
  selectedFiles
}: MediaFileListProps) {
  const [hoveredFile, setHoveredFile] = useState<string | null>(null);

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy URL");
    }
  };

  const handleDownload = async (file: any) => {
    try {
      const { data, error } = await supabase.storage
        .from("media-library")
        .download(file.file_path);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const handleSelect = (file: any) => {
    if (onSelect) {
      const { data } = supabase.storage
        .from("media-library")
        .getPublicUrl(file.file_path);
      onSelect(data.publicUrl);
    }
  };

  const isImage = (mimeType: string) => mimeType.startsWith("image/");

  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {files.map((file) => (
          <ContextMenu key={file.id}>
            <ContextMenuTrigger>
              <Card
                className={`relative group cursor-pointer overflow-hidden ${
                  selectedFiles.has(file.id) ? "ring-2 ring-primary" : ""
                }`}
                onMouseEnter={() => setHoveredFile(file.id)}
                onMouseLeave={() => setHoveredFile(null)}
                onClick={() => isSelectionMode && handleSelect(file)}
              >
                <div className="aspect-square relative">
                  {isImage(file.mime_type) ? (
                    <img
                      src={`${
                        import.meta.env.VITE_SUPABASE_URL
                      }/storage/v1/object/public/media-library/${file.file_path}`}
                      alt={file.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <FileText className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <div
                    className={`absolute inset-0 bg-black/50 transition-opacity flex items-center justify-center gap-2 ${
                      hoveredFile === file.id ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {showInsertButton && (
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(file);
                        }}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(file);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        const { data } = supabase.storage
                          .from("media-library")
                          .getPublicUrl(file.file_path);
                        handleCopyUrl(data.publicUrl);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(file.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-sm font-medium truncate">
                        {file.filename}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{file.filename}</p>
                    </TooltipContent>
                  </Tooltip>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </Card>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem
                onClick={() => {
                  const { data } = supabase.storage
                    .from("media-library")
                    .getPublicUrl(file.file_path);
                  handleCopyUrl(data.publicUrl);
                }}
              >
                Copy URL
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleDownload(file)}>
                Download
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onDelete(file.id)}>
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>
    </ScrollArea>
  );
}