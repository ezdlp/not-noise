import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Image, Upload, Trash2, Search, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";

interface MediaLibraryProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

type MediaFile = Database['public']['Tables']['media_files']['Row'] & {
  dimensions?: {
    width: number;
    height: number;
  };
};

export function MediaLibrary({ onSelect, onClose }: MediaLibraryProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, []);

  const { data: mediaFiles, refetch } = useQuery({
    queryKey: ["mediaFiles", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("media_files")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.ilike("filename", `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MediaFile[];
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setSelectedFile(file);
        await handleFileUpload(file);
      } else {
        toast.error("Please upload an image file");
      }
    }
  };

  const handleFileUpload = async (fileToUpload: File = selectedFile) => {
    if (!fileToUpload || !userId) return;

    setUploading(true);
    try {
      const fileExt = fileToUpload.name.split(".").pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("media-library")
        .upload(filePath, fileToUpload);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("media-library")
        .getPublicUrl(filePath);

      const img = document.createElement('img');
      const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
        };
        img.src = publicUrl;
      });

      const { error: dbError } = await supabase
        .from("media_files")
        .insert({
          filename: fileToUpload.name,
          file_path: filePath,
          mime_type: fileToUpload.type,
          size: fileToUpload.size,
          uploaded_by: userId,
          dimensions,
          usage_count: 0,
          last_used: new Date().toISOString(),
        });

      if (dbError) throw dbError;

      toast.success("File uploaded successfully");
      refetch();
      setSelectedFile(null);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, filePath: string) => {
    try {
      const { data: usageData, error: usageError } = await supabase
        .from("media_usage")
        .select("post_id")
        .eq("media_id", id);

      if (usageError) throw usageError;

      if (usageData && usageData.length > 0) {
        toast.error("This file is currently being used in posts and cannot be deleted");
        return;
      }

      const { error: storageError } = await supabase.storage
        .from("media-library")
        .remove([filePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("media_files")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;

      toast.success("File deleted successfully");
      refetch();
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
    }
  };

  const toggleFileSelection = (id: string) => {
    const newSelectedFiles = new Set(selectedFiles);
    if (selectedFiles.has(id)) {
      newSelectedFiles.delete(id);
    } else {
      newSelectedFiles.add(id);
    }
    setSelectedFiles(newSelectedFiles);
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;

    try {
      // Check if any selected files are in use
      const { data: usageData, error: usageError } = await supabase
        .from("media_usage")
        .select("media_id")
        .in("media_id", Array.from(selectedFiles));

      if (usageError) throw usageError;

      if (usageData && usageData.length > 0) {
        toast.error("Some files are currently being used in posts and cannot be deleted");
        return;
      }

      // Get file paths for selected files
      const { data: fileData, error: fileError } = await supabase
        .from("media_files")
        .select("file_path")
        .in("id", Array.from(selectedFiles));

      if (fileError) throw fileError;

      if (!fileData) return;

      // Delete files from storage
      const { error: storageError } = await supabase.storage
        .from("media-library")
        .remove(fileData.map(f => f.file_path));

      if (storageError) throw storageError;

      // Delete records from database
      const { error: dbError } = await supabase
        .from("media_files")
        .delete()
        .in("id", Array.from(selectedFiles));

      if (dbError) throw dbError;

      toast.success(`${selectedFiles.size} files deleted successfully`);
      setSelectedFiles(new Set());
      setIsSelectionMode(false);
      refetch();
    } catch (error) {
      console.error("Error deleting files:", error);
      toast.error("Failed to delete files");
    }
  };

  return (
    <div 
      className={cn(
        "space-y-4",
        dragActive && "opacity-50"
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          className="max-w-[200px]"
        />
        <Button
          onClick={() => handleFileUpload()}
          disabled={!selectedFile || uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setIsSelectionMode(!isSelectionMode);
            if (!isSelectionMode) {
              setSelectedFiles(new Set());
            }
          }}
        >
          {isSelectionMode ? "Cancel Selection" : "Select Multiple"}
        </Button>
        {isSelectionMode && selectedFiles.size > 0 && (
          <Button
            variant="destructive"
            onClick={handleBulkDelete}
          >
            Delete Selected ({selectedFiles.size})
          </Button>
        )}
      </div>

      <ScrollArea className="h-[400px] border rounded-md p-4">
        <div className="grid grid-cols-3 gap-4">
          {mediaFiles?.map((file) => {
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
                onClick={() => isSelectionMode ? toggleFileSelection(file.id) : null}
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
                        handleDelete(file.id, file.file_path);
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
      </ScrollArea>
    </div>
  );
}