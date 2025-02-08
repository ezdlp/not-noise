
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Upload } from "lucide-react";

interface MediaToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  selectedFile: File | null;
  uploading: boolean;
  isSelectionMode: boolean;
  selectedFilesCount: number;
  onToggleSelectionMode: () => void;
  onBulkDelete: () => void;
}

export function MediaToolbar({
  searchTerm,
  onSearchChange,
  onFileSelect,
  onUpload,
  selectedFile,
  uploading,
  isSelectionMode,
  selectedFilesCount,
  onToggleSelectionMode,
  onBulkDelete,
}: MediaToolbarProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
      <Input
        type="file"
        accept="image/*"
        onChange={onFileSelect}
        className="max-w-[200px]"
      />
      <Button
        onClick={onUpload}
        disabled={!selectedFile || uploading}
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        Upload
      </Button>
      <Button
        variant="outline"
        onClick={onToggleSelectionMode}
      >
        {isSelectionMode ? "Cancel Selection" : "Select Multiple"}
      </Button>
      {isSelectionMode && selectedFilesCount > 0 && (
        <Button
          variant="destructive"
          onClick={onBulkDelete}
        >
          Delete Selected ({selectedFilesCount})
        </Button>
      )}
    </div>
  );
}
