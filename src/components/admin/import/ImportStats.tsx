
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ImportSummary {
  total: number;
  success: number;
  errors: { link: string; error: string }[];
  unimported: string[];
}

interface ChunkProgress {
  current: number;
  total: number;
}

interface ImportStatsProps {
  onComplete?: () => void;
}

const ImportStats = ({ onComplete }: ImportStatsProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [testMode, setTestMode] = useState(true);
  const [chunkProgress, setChunkProgress] = useState<ChunkProgress>({ current: 0, total: 0 });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setProgress(0);
      setSummary(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('testMode', testMode.toString());

      const { data, error } = await supabase.functions.invoke('wordpress-smartlinks-stats-import', {
        body: formData,
      });

      if (error) throw error;

      setSummary(data);

      if (data.success > 0) {
        toast.success(`Successfully imported stats for ${data.success} smart links`);
        onComplete?.();
      }

      if (data.errors.length > 0) {
        toast.error(`Failed to import stats for ${data.errors.length} smart links`);
      }

      if (data.unimported.length > 0) {
        toast.warning(`${data.unimported.length} smart links were not found`);
      }

    } catch (error) {
      console.error("Error importing stats:", error);
      toast.error("Failed to import stats");
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept=".xml"
            onChange={handleFileUpload}
            disabled={isImporting}
            className="max-w-[300px]"
          />
          <Button disabled={isImporting} variant="outline" size="icon">
            <Upload className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="test-mode"
            checked={testMode}
            onCheckedChange={setTestMode}
          />
          <Label htmlFor="test-mode">Test Mode (first 10 items only)</Label>
        </div>
      </div>

      {isImporting && (
        <div className="space-y-2">
          <Progress value={progress} className="w-[300px]" />
          <p className="text-sm text-muted-foreground">
            Importing stats... {Math.round(progress)}%
            {chunkProgress.total > 1 && (
              <span className="ml-2">
                (Processing chunk {chunkProgress.current} of {chunkProgress.total})
              </span>
            )}
          </p>
        </div>
      )}

      {summary && (
        <Dialog open={!!summary} onOpenChange={() => setSummary(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Import Summary {testMode && "(Test Mode)"}</DialogTitle>
              <DialogDescription>
                Results of the stats import process
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium">Total Processed</p>
                  <p className="text-2xl font-bold">{summary.total}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium">Successfully Imported</p>
                  <p className="text-2xl font-bold text-green-600">{summary.success}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{summary.errors.length}</p>
                </div>
              </div>

              {summary.errors.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Errors</h3>
                  <ScrollArea className="h-[200px] border rounded-md p-4">
                    {summary.errors.map((error, index) => (
                      <div key={index} className="py-2 border-b last:border-0">
                        <p className="font-medium">{error.link}</p>
                        <p className="text-sm text-red-600">{error.error}</p>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}

              {summary.unimported.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Unimported Smart Links</h3>
                  <ScrollArea className="h-[200px] border rounded-md p-4">
                    {summary.unimported.map((link, index) => (
                      <p key={index} className="py-2 border-b last:border-0">{link}</p>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => setSummary(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ImportStats;
