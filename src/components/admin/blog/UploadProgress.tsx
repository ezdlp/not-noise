import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface UploadProgressProps {
  file: File;
  progress: number;
  onCancel: () => void;
}

export function UploadProgress({ file, progress, onCancel }: UploadProgressProps) {
  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground truncate max-w-[200px]">
          {file.name}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <Progress value={progress} className="h-2" />
      <span className="text-xs text-muted-foreground">
        {Math.round(progress)}% • {(file.size / (1024 * 1024)).toFixed(2)} MB
      </span>
    </div>
  );
}