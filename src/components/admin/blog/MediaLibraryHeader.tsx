import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Upload } from "lucide-react";
import { useMediaLibrary } from "./MediaLibraryContext";

interface MediaLibraryHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  selectedFile: File | null;
  uploading: boolean;
  onBulkDelete: () => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}

export function MediaLibraryHeader({
  searchTerm,
  onSearchChange,
  onFileSelect,
  onUpload,
  selectedFile,
  uploading,
  onBulkDelete,
  sortBy,
  onSortChange,
}: MediaLibraryHeaderProps) {
  const { isSelectionMode, selectedFiles, toggleSelectionMode } = useMediaLibrary();

  return (
    <div className="space-y-4">
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
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Newest first</SelectItem>
            <SelectItem value="date-asc">Oldest first</SelectItem>
            <SelectItem value="name-asc">Name A-Z</SelectItem>
            <SelectItem value="name-desc">Name Z-A</SelectItem>
            <SelectItem value="size-desc">Largest first</SelectItem>
            <SelectItem value="size-asc">Smallest first</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-4">
        <Input
          type="file"
          accept="image/*"
          onChange={onFileSelect}
          className="max-w-[200px]"
        />
        <Button
          onClick={onUpload}
          disabled={!selectedFile || uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
        <Button
          variant="outline"
          onClick={toggleSelectionMode}
        >
          {isSelectionMode ? "Cancel Selection" : "Select Multiple"}
        </Button>
        {isSelectionMode && selectedFiles.size > 0 && (
          <Button
            variant="destructive"
            onClick={onBulkDelete}
          >
            Delete Selected ({selectedFiles.size})
          </Button>
        )}
      </div>
    </div>
  );
}