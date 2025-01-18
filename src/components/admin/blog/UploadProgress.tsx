import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface UploadProgressProps {
  file: File;
  progress: number;
  onCancel: () => void;
  originalSize?: number;
  compressedSize?: number;
}

export function UploadProgress({ file, progress, onCancel, originalSize, compressedSize }: UploadProgressProps) {
  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    return `${(bytes / 1024).toFixed(1)}KB`;
  };

  const compressionInfo = originalSize && compressedSize ? (
    <span className="text-xs text-muted-foreground">
      {formatSize(originalSize)} → {formatSize(compressedSize)} ({Math.round((1 - compressedSize/originalSize) * 100)}% smaller)
    </span>
  ) : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">{file.name}</p>
          {compressionInfo}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <Progress value={progress} />
    </div>
  );
}