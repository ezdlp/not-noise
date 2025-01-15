import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MediaToolbar } from "./MediaToolbar";
import { MediaFileGrid } from "./MediaFileGrid";
import { cn } from "@/lib/utils";

interface MediaLibraryProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

export function MediaLibrary({ onSelect, onClose }: MediaLibraryProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

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
      return data;
    },
  });

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
      setSelectedFiles(new Set());
      setIsSelectionMode(false);
      refetch();
    } catch (error) {
      console.error("Error deleting files:", error);
      toast.error("Failed to delete files");
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
      await handleFileUpload(e.dataTransfer.files[0]);
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
      <MediaToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onFileSelect={(e) => setSelectedFile(e.target.files?.[0] || null)}
        onUpload={() => handleFileUpload()}
        selectedFile={selectedFile}
        uploading={uploading}
        isSelectionMode={isSelectionMode}
        selectedFilesCount={selectedFiles.size}
        onToggleSelectionMode={() => {
          setIsSelectionMode(!isSelectionMode);
          if (!isSelectionMode) {
            setSelectedFiles(new Set());
          }
        }}
        onBulkDelete={handleBulkDelete}
      />

      <ScrollArea className="h-[400px] border rounded-md p-4">
        <MediaFileGrid
          files={mediaFiles}
          isSelectionMode={isSelectionMode}
          selectedFiles={selectedFiles}
          onSelect={onSelect}
          onDelete={handleDelete}
          onToggleSelection={toggleFileSelection}
        />
      </ScrollArea>
    </div>
  );
}