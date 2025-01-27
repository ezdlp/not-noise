import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, Grid, List, Trash2 } from "lucide-react";
import { useMediaLibrary } from "./MediaLibraryContext";
import { CompressionLevel } from "@/utils/imageCompression";

interface MediaLibraryHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  maxFileSize: number;
  allowedTypes: string[];
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onBulkDelete: () => void;
  compressionEnabled: boolean;
  onCompressionChange: (enabled: boolean) => void;
  compressionLevel: CompressionLevel;
  onCompressionLevelChange: (level: CompressionLevel) => void;
}

export function MediaLibraryHeader({
  searchTerm,
  onSearchChange,
  onFileSelect,
  sortBy,
  onSortChange,
  maxFileSize,
  allowedTypes,
  viewMode,
  onViewModeChange,
  onBulkDelete,
  compressionEnabled,
  onCompressionChange,
  compressionLevel,
  onCompressionLevelChange,
}: MediaLibraryHeaderProps) {
  const { isSelectionMode, toggleSelectionMode, selectedFiles } = useMediaLibrary();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => onViewModeChange('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={onFileSelect}
            accept={allowedTypes.join(',')}
            multiple
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>

          {isSelectionMode ? (
            <>
              <Button
                variant="destructive"
                onClick={onBulkDelete}
                disabled={selectedFiles.size === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
              <Button variant="outline" onClick={toggleSelectionMode}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={toggleSelectionMode}>
              Select Files
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="sort-by">Sort by</Label>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (newest)</SelectItem>
                <SelectItem value="date-asc">Date (oldest)</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="size-desc">Size (largest)</SelectItem>
                <SelectItem value="size-asc">Size (smallest)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="compression">Compression</Label>
            <Switch
              id="compression"
              checked={compressionEnabled}
              onCheckedChange={onCompressionChange}
            />
          </div>

          {compressionEnabled && (
            <div className="flex items-center gap-2">
              <Label htmlFor="compression-level">Level</Label>
              <Select value={compressionLevel} onValueChange={onCompressionLevelChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Level..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          Max file size: {maxFileSize / (1024 * 1024)}MB
        </div>
      </div>
    </div>
  );
}