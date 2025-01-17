import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutGrid, List, Search } from "lucide-react";
import { useMediaLibrary } from "./MediaLibraryContext";

interface MediaLibraryHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBulkDelete?: () => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  maxFileSize: number;
  allowedTypes: string[];
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function MediaLibraryHeader({
  searchTerm,
  onSearchChange,
  onFileSelect,
  onBulkDelete,
  sortBy,
  onSortChange,
  maxFileSize,
  allowedTypes,
  viewMode,
  onViewModeChange,
}: MediaLibraryHeaderProps) {
  const { isSelectionMode, selectedFiles, toggleSelectionMode } = useMediaLibrary();

  const formatAllowedTypes = (types: string[]) => {
    return types.map(type => type.replace('image/', '.')).join(', ');
  };

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
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => onViewModeChange('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
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
        <div className="space-y-1">
          <Input
            type="file"
            accept={allowedTypes.join(',')}
            onChange={onFileSelect}
            className="max-w-[300px]"
            multiple
          />
          <p className="text-xs text-muted-foreground">
            Max size: {maxFileSize / (1024 * 1024)}MB • Allowed types: {formatAllowedTypes(allowedTypes)}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={toggleSelectionMode}
        >
          {isSelectionMode ? "Cancel Selection" : "Select Multiple"}
        </Button>
        {isSelectionMode && selectedFiles.size > 0 && onBulkDelete && (
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