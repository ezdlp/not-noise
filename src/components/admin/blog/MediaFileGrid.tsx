import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Trash2, Plus, Pencil, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useMediaLibrary } from "./MediaLibraryContext";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MediaFileGridProps {
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

export function MediaFileGrid({
  files,
  isSelectionMode,
  selectedFiles,
  onSelect,
  onDelete,
  showInsertButton = false,
}: MediaFileGridProps) {
  const { toggleFileSelection } = useMediaLibrary();
  const [editingMetadata, setEditingMetadata] = useState<MediaMetadata | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{ id: string, filePath: string } | null>(null);

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

  const handleDeleteClick = (id: string, filePath: string) => {
    setFileToDelete({ id, filePath });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    
    await onDelete(fileToDelete.id, fileToDelete.filePath);
    setShowDeleteConfirm(false);
    setFileToDelete(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {files?.map((file) => {
          const { data: { publicUrl } } = supabase.storage
            .from("media-library")
            .getPublicUrl(file.file_path);

          return (
            <div
              key={file.id}
              className={cn(
                "relative group border rounded-md p-3 overflow-hidden",
                isSelectionMode && "cursor-pointer hover:bg-accent/50",
                selectedFiles.has(file.id) && "ring-2 ring-primary",
                "hover:shadow-md transition-all duration-200"
              )}
              onClick={() => isSelectionMode ? toggleFileSelection(file.id) : null}
            >
              <div className="aspect-square relative bg-accent/5 rounded-md overflow-hidden">
                <img
                  src={publicUrl}
                  alt={file.alt_text || file.filename}
                  className="w-full h-full object-cover rounded cursor-pointer"
                  onClick={(e) => {
                    if (!isSelectionMode) {
                      e.stopPropagation();
                      onSelect(publicUrl);
                    }
                  }}
                />
                
                {!isSelectionMode && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {showInsertButton && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(publicUrl);
                        }}
                        className="flex items-center gap-1.5 whitespace-nowrap"
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
                        handleDeleteClick(file.id, file.file_path);
                      }}
                      className="flex items-center gap-1.5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="mt-2 space-y-1">
                <p className="text-sm font-medium truncate" title={file.filename}>
                  {file.filename}
                </p>
                <p className="text-xs text-muted-foreground">
                  {file.dimensions ? `${file.dimensions.width}x${file.dimensions.height}` : ""}
                  {file.size && ` • ${(file.size / 1024).toFixed(1)}KB`}
                </p>
              </div>

              {isSelectionMode && selectedFiles.has(file.id) && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}