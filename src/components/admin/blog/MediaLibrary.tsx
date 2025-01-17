import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MediaFileGrid } from "./MediaFileGrid";
import { cn } from "@/lib/utils";
import { MediaLibraryHeader } from "./MediaLibraryHeader";
import { MediaLibraryProvider, useMediaLibrary } from "./MediaLibraryContext";
import { UploadProgress } from "./UploadProgress";
import { MediaFileList } from "./MediaFileList";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface UploadingFile {
  file: File;
  progress: number;
  controller?: AbortController;
}

interface MediaLibraryProps {
  onSelect: (url: string) => void;
  onClose: () => void;
  showInsertButton?: boolean;
}

function MediaLibraryContent({ onSelect, showInsertButton }: { onSelect: (url: string) => void; showInsertButton?: boolean }) {
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadingFile>>(new Map());
  const [userId, setUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [sortBy, setSortBy] = useState("date-desc");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list'); // Changed default to 'list'

  const { selectedFiles, isSelectionMode } = useMediaLibrary();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    getUser();
  }, []);

  const { data: mediaFiles, refetch } = useQuery({
    queryKey: ["mediaFiles", searchTerm, sortBy],
    queryFn: async () => {
      let query = supabase
        .from("media_files")
        .select("*");

      if (searchTerm) {
        query = query.ilike("filename", `%${searchTerm}%`);
      }

      // Apply sorting
      switch (sortBy) {
        case "date-desc":
          query = query.order("created_at", { ascending: false });
          break;
        case "date-asc":
          query = query.order("created_at", { ascending: true });
          break;
        case "name-asc":
          query = query.order("filename", { ascending: true });
          break;
        case "name-desc":
          query = query.order("filename", { ascending: false });
          break;
        case "size-desc":
          query = query.order("size", { ascending: false });
          break;
        case "size-asc":
          query = query.order("size", { ascending: true });
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `File type ${file.type} is not supported. Please upload an image file.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit.`;
    }
    return null;
  };

  const handleFileUpload = async (fileToUpload: File) => {
    const error = validateFile(fileToUpload);
    if (error) {
      toast.error(error);
      return;
    }

    const controller = new AbortController();
    const fileId = crypto.randomUUID();

    setUploadingFiles(prev => new Map(prev).set(fileId, {
      file: fileToUpload,
      progress: 0,
      controller
    }));

    try {
      const fileExt = fileToUpload.name.split(".").pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      // Create a ReadableStream from the file
      const stream = fileToUpload.stream();
      const reader = stream.getReader();
      const totalSize = fileToUpload.size;
      let uploadedSize = 0;

      // Read the file in chunks and update progress
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        uploadedSize += value.length;
        const progress = (uploadedSize / totalSize) * 100;
        
        setUploadingFiles(prev => {
          const updated = new Map(prev);
          const file = updated.get(fileId);
          if (file) {
            updated.set(fileId, { ...file, progress });
          }
          return updated;
        });
      }

      // Combine chunks and upload
      const file = new Blob(chunks, { type: fileToUpload.type });
      const { error: uploadError } = await supabase.storage
        .from("media-library")
        .upload(filePath, file, {
          contentType: fileToUpload.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("media-library")
        .getPublicUrl(filePath);

      // Get image dimensions
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
    } catch (error) {
      if (error.name === 'AbortError') {
        toast.info("Upload cancelled");
      } else {
        console.error("Error uploading file:", error);
        toast.error("Failed to upload file");
      }
    } finally {
      setUploadingFiles(prev => {
        const updated = new Map(prev);
        updated.delete(fileId);
        return updated;
      });
    }
  };

  const handleMultipleFiles = async (files: FileList) => {
    for (const file of Array.from(files)) {
      await handleFileUpload(file);
    }
  };

  const cancelUpload = (fileId: string) => {
    const file = uploadingFiles.get(fileId);
    if (file?.controller) {
      file.controller.abort();
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

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;

    try {
      const { data: usageData, error: usageError } = await supabase
        .from("media_usage")
        .select("media_id")
        .in("media_id", Array.from(selectedFiles));

      if (usageError) throw usageError;

      if (usageData && usageData.length > 0) {
        toast.error("Some files are currently being used in posts and cannot be deleted");
        return;
      }

      const { data: fileData, error: fileError } = await supabase
        .from("media_files")
        .select("file_path")
        .in("id", Array.from(selectedFiles));

      if (fileError) throw fileError;
      if (!fileData) return;

      const { error: storageError } = await supabase.storage
        .from("media-library")
        .remove(fileData.map(f => f.file_path));

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("media_files")
        .delete()
        .in("id", Array.from(selectedFiles));

      if (dbError) throw dbError;

      toast.success(`${selectedFiles.size} files deleted successfully`);
      refetch();
    } catch (error) {
      console.error("Error deleting files:", error);
      toast.error("Failed to delete files");
    }
  };

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
      await handleMultipleFiles(e.dataTransfer.files);
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
      <MediaLibraryHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onFileSelect={(e) => {
          if (e.target.files?.length) {
            handleMultipleFiles(e.target.files);
          }
        }}
        sortBy={sortBy}
        onSortChange={setSortBy}
        maxFileSize={MAX_FILE_SIZE}
        allowedTypes={ALLOWED_TYPES}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {uploadingFiles.size > 0 && (
        <div className="space-y-4 border rounded-md p-4">
          <h3 className="text-sm font-medium">Uploading {uploadingFiles.size} file(s)</h3>
          <div className="space-y-4">
            {Array.from(uploadingFiles.entries()).map(([id, { file, progress }]) => (
              <UploadProgress
                key={id}
                file={file}
                progress={progress}
                onCancel={() => cancelUpload(id)}
              />
            ))}
          </div>
        </div>
      )}

      <ScrollArea className="h-[400px] border rounded-md p-4">
        {viewMode === 'grid' ? (
          <MediaFileGrid
            files={mediaFiles}
            isSelectionMode={isSelectionMode}
            selectedFiles={selectedFiles}
            onSelect={onSelect}
            onDelete={handleDelete}
            showInsertButton={showInsertButton}
          />
        ) : (
          <MediaFileList
            files={mediaFiles}
            isSelectionMode={isSelectionMode}
            selectedFiles={selectedFiles}
            onSelect={onSelect}
            onDelete={handleDelete}
            showInsertButton={showInsertButton}
          />
        )}
      </ScrollArea>
    </div>
  );
}

export function MediaLibrary({ onSelect, onClose, showInsertButton = false }: MediaLibraryProps) {
  return (
    <MediaLibraryProvider>
      <MediaLibraryContent onSelect={onSelect} showInsertButton={showInsertButton} />
    </MediaLibraryProvider>
  );
}
