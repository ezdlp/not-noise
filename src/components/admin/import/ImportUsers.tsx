import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface ImportUsersProps {
  onComplete?: () => void;
}

export function ImportUsers({ onComplete }: ImportUsersProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    toast.info("User import functionality coming soon");
    if (onComplete) onComplete();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept=".xml,.json"
          onChange={handleFileUpload}
          disabled={isImporting}
          className="max-w-[300px]"
        />
        <Button disabled={isImporting} variant="outline" size="icon">
          <Upload className="h-4 w-4" />
        </Button>
      </div>

      {isImporting && (
        <div className="space-y-2">
          <Progress value={progress} className="w-[300px]" />
          <p className="text-sm text-muted-foreground">
            Importing users... {Math.round(progress)}%
          </p>
        </div>
      )}
    </div>
  );
}