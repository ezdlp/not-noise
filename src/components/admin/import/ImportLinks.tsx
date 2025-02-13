
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
  unassigned: string[];
  emailMatches?: { 
    email: string;
    found: boolean;
    title: string;
    matchAttempt: string;
  }[];
}

export function ImportLinks() {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [testMode, setTestMode] = useState(true);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setProgress(10);

      // Convert file to base64
      const reader = new FileReader();
      const filePromise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
      reader.readAsDataURL(file);
      
      const base64File = await filePromise;
      
      const { data, error } = await supabase.functions.invoke('wordpress-smartlinks-import', {
        body: {
          fileContent: base64File,
          testMode: testMode,
          fileName: file.name
        }
      });

      if (error) throw error;

      setProgress(100);

      // Ensure data has the expected structure with default values
      const processedData: ImportSummary = {
        total: data?.total ?? 0,
        success: data?.success ?? 0,
        errors: Array.isArray(data?.errors) ? data.errors : [],
        unassigned: Array.isArray(data?.unassigned) ? data.unassigned : [],
        emailMatches: Array.isArray(data?.emailMatches) ? data.emailMatches : []
      };

      setSummary(processedData);

      if (processedData.success > 0) {
        toast.success(`Successfully imported ${processedData.success} smart links`);
      }

      if (processedData.errors.length > 0) {
        toast.error(`Failed to import ${processedData.errors.length} smart links`);
      }

      if (processedData.unassigned.length > 0) {
        toast.warning(`${processedData.unassigned.length} smart links were unassigned`);
      }
    } catch (error) {
      console.error("Error importing smart links:", error);
      toast.error("Failed to import smart links");
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
            Importing smart links... {Math.round(progress)}%
          </p>
        </div>
      )}

      {summary && (
        <Dialog open={!!summary} onOpenChange={() => setSummary(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Import Summary {testMode && "(Test Mode)"}</DialogTitle>
              <DialogDescription>
                Results of the smart links import process
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

              {summary.unassigned.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Unassigned Smart Links</h3>
                  <ScrollArea className="h-[200px] border rounded-md p-4">
                    {summary.unassigned.map((link, index) => (
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
}
