import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Trash2, Plus, Pencil, Copy, FileVideo, FileAudio, Image, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useMediaLibrary } from "./MediaLibraryContext";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MediaFileListProps {
  files: any[];
  isSelectionMode: boolean;
  selectedFiles: Set<string>;
  onSelect: (url: string) => void;
  onDelete: (id: string, filePath: string) => void;
  showInsertButton?: boolean;
}

interface MediaMetadata {
  id: string;
  alt_text: string;
  caption: string;
  filename: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getOptimizationSuggestions = (file: any): string[] => {
  const suggestions: string[] = [];
  const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
  const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB

  if (file.mime_type.startsWith('image/')) {
    if (file.size > MAX_IMAGE_SIZE) {
      suggestions.push('Consider compressing this image to improve load times');
      if (file.dimensions && (file.dimensions.width > 2000 || file.dimensions.height > 2000)) {
        suggestions.push('Image dimensions are very large. Consider resizing to max 2000px');
      }
      if (!file.mime_type.includes('webp')) {
        suggestions.push('Convert to WebP format for better compression');
      }
    }
  } else if (file.mime_type.startsWith('video/')) {
    if (file.size > MAX_VIDEO_SIZE) {
      suggestions.push('Video file is large. Consider compressing or using a streaming service');
    }
  }

  return suggestions;
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
  if (mimeType.startsWith('video/')) return <FileVideo className="h-4 w-4" />;
  if (mimeType.startsWith('audio/')) return <FileAudio className="h-4 w-4" />;
  if (mimeType === 'application/pdf') return <FileVideo className="h-4 w-4" />; // Using FileVideo as fallback for PDF
  return <Image className="h-4 w-4" />;
};

const FilePreview = ({ file, publicUrl }: { file: any; publicUrl: string }) => {
  if (file.mime_type.startsWith('image/')) {
    return (
      <img
        src={publicUrl}
        alt={file.alt_text || file.filename}
        className="w-full h-full object-cover rounded"
      />
    );
  }

  if (file.mime_type.startsWith('video/')) {
    return (
      <video
        src={publicUrl}
        controls
        className="w-full h-full object-cover rounded"
      />
    );
  }

  if (file.mime_type.startsWith('audio/')) {
    return (
      <audio
        src={publicUrl}
        controls
        className="w-full"
      />
    );
  }

  if (file.mime_type === 'application/pdf') {
    return (
      <iframe
        src={publicUrl}
        className="w-full h-full min-h-[200px] rounded"
      />
    );
  }

};

export function MediaFileList({
  files,
  isSelectionMode,
  selectedFiles,
  onSelect,
  onDelete,
  showInsertButton = false,
}: MediaFileListProps) {
  const { toggleFileSelection } = useMediaLibrary();
  const [editingMetadata, setEditingMetadata] = useState<MediaMetadata | null>(null);
  const [showOptimizationDetails, setShowOptimizationDetails] = useState<string | null>(null);

  const handleMetadataSubmit = async () => {
    if (!editingMetadata) return;

    try {
      const { error } = await supabase
        .from("media_files")
        .update({
          alt_text: editingMetadata.alt_text,
          caption: editingMetadata.caption,
          filename: editingMetadata.filename,
        })
        .eq("id", editingMetadata.id);

      if (error) throw error;
      toast.success("Metadata updated successfully");
      setEditingMetadata(null);
    } catch (error) {
      console.error("Error updating metadata:", error);
      toast.error("Failed to update metadata");
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy URL");
    }
  };

  return (
    <div className="space-y-2">
      {files?.map((file) => {
        const { data: { publicUrl } } = supabase.storage
          .from("media-library")
          .getPublicUrl(file.file_path);

        const suggestions = getOptimizationSuggestions(file);
        const needsOptimization = suggestions.length > 0;

        return (
          <div
            key={file.id}
            className={cn(
              "relative group border rounded-lg p-4 transition-all duration-200",
              isSelectionMode && "cursor-pointer hover:bg-accent/50",
              selectedFiles.has(file.id) && "ring-2 ring-primary",
              "hover:shadow-md hover:bg-accent/5"
            )}
            onClick={() => isSelectionMode ? toggleFileSelection(file.id) : null}
          >
            <div className="flex items-start gap-4">
              {/* Preview Section */}
              <div className="w-24 h-24 flex-shrink-0 relative bg-accent/5 rounded-lg overflow-hidden">
                <FilePreview file={file} publicUrl={publicUrl} />
                {needsOptimization && (
                  <div className="absolute -top-2 -right-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 bg-yellow-100 hover:bg-yellow-200 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowOptimizationDetails(showOptimizationDetails === file.id ? null : file.id);
                      }}
                    >
                      <AlertTriangle className="h-4 w-4 text-yellow-700" />
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Metadata Section */}
              <div className="flex-1 min-w-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h3 className="font-medium truncate flex items-center gap-2 max-w-[300px]" title={file.filename}>
                        {getFileIcon(file.mime_type)}
                        <span className="truncate">{file.filename}</span>
                      </h3>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{file.filename}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(file.created_at), 'PPp')} • 
                  {file.dimensions ? ` ${file.dimensions.width}x${file.dimensions.height} • ` : ' '}
                  {formatFileSize(file.size)}
                </p>
                {file.alt_text && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                          Alt: {file.alt_text}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{file.alt_text}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {showOptimizationDetails === file.id && suggestions.length > 0 && (
                  <Alert className="mt-2 bg-yellow-50 text-yellow-800 border-yellow-200">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {suggestions.map((suggestion, index) => (
                          <li key={index} className="text-sm">{suggestion}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Actions Section */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {!isSelectionMode && (
                  <>
                    {showInsertButton && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(publicUrl);
                        }}
                        className="flex items-center gap-1.5 whitespace-nowrap bg-primary hover:bg-primary/90"
                      >
                        <Plus className="h-4 w-4" />
                        Insert
                      </Button>
                    )}
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingMetadata({
                              id: file.id,
                              alt_text: file.alt_text || "",
                              caption: file.caption || "",
                              filename: file.filename,
                            });
                          }}
                          className="flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Media Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="filename">Filename</Label>
                            <Input
                              id="filename"
                              value={editingMetadata?.filename || ""}
                              onChange={(e) => setEditingMetadata(prev => prev ? { ...prev, filename: e.target.value } : null)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="alt">Alt Text</Label>
                            <Input
                              id="alt"
                              value={editingMetadata?.alt_text || ""}
                              onChange={(e) => setEditingMetadata(prev => prev ? { ...prev, alt_text: e.target.value } : null)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="caption">Caption</Label>
                            <Textarea
                              id="caption"
                              value={editingMetadata?.caption || ""}
                              onChange={(e) => setEditingMetadata(prev => prev ? { ...prev, caption: e.target.value } : null)}
                            />
                          </div>
                          <Button onClick={handleMetadataSubmit}>Save Changes</Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(publicUrl);
                      }}
                      className="flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Copy className="h-4 w-4" />
                      Copy URL
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(file.id, file.file_path);
                      }}
                      className="flex items-center gap-1.5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {isSelectionMode && selectedFiles.has(file.id) && (
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
