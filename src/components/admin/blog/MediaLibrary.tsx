import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Image, Upload, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface MediaLibraryProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

interface MediaFile {
  id: string;
  filename: string;
  file_path: string;
  mime_type: string;
  size: number;
  width?: number;
  height?: number;
  alt_text?: string;
  caption?: string;
}

export function MediaLibrary({ onSelect, onClose }: MediaLibraryProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: mediaFiles, refetch } = useQuery({
    queryKey: ["mediaFiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_files")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as MediaFile[];
    },
  });

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split(".").pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("media-library")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("media-library")
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from("media_files")
        .insert({
          filename: selectedFile.name,
          file_path: filePath,
          mime_type: selectedFile.type,
          size: selectedFile.size,
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
        />
        <Button
          onClick={handleFileUpload}
          disabled={!selectedFile || uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
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
                className="relative group border rounded-md p-2"
              >
                <img
                  src={publicUrl}
                  alt={file.alt_text || file.filename}
                  className="w-full h-32 object-cover rounded cursor-pointer"
                  onClick={() => onSelect(publicUrl)}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(file.id, file.file_path)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm mt-2 truncate">{file.filename}</p>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}