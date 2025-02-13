
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
}

interface ChunkProgress {
  current: number;
  total: number;
}

async function splitXMLFile(file: File, chunkSize: number = 200000) { // 200KB chunks for safer memory usage
  const text = await file.text();
  const chunks: string[] = [];
  
  // Find all <item> elements
  const itemRegex = /<item[\s\S]*?<\/item>/g;
  const items = text.match(itemRegex) || [];
  
  let currentChunk = '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>';
  let currentSize = currentChunk.length;
  
  for (const item of items) {
    if (currentSize + item.length > chunkSize) {
      // Close the current chunk
      currentChunk += '\n</channel>\n</rss>';
      chunks.push(currentChunk);
      
      // Start a new chunk
      currentChunk = '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>';
      currentSize = currentChunk.length;
    }
    
    currentChunk += '\n' + item;
    currentSize += item.length + 1;
  }
  
  // Add the last chunk if it has content
  if (currentSize > 0) {
    currentChunk += '\n</channel>\n</rss>';
    chunks.push(currentChunk);
  }
  
  return chunks;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function ImportLinks() {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [testMode, setTestMode] = useState(true);
  const [chunkProgress, setChunkProgress] = useState<ChunkProgress>({ current: 0, total: 0 });

  const processChunkWithRetry = async (
    chunk: string, 
    chunkIndex: number, 
    totalChunks: number,
    retryCount: number = 0
  ): Promise<ImportSummary> => {
    try {
      const formData = new FormData();
      const blob = new Blob([chunk], { type: 'text/xml' });
      const file = new File([blob], 'chunk.xml', { type: 'text/xml' });
      
      formData.append('file', file);
      formData.append('testMode', testMode.toString());

      const { data, error } = await supabase.functions.invoke('wordpress-smartlinks-import', {
        body: formData,
      });

      if (error) throw error;

      setChunkProgress({ current: chunkIndex + 1, total: totalChunks });
      setProgress(((chunkIndex + 1) / totalChunks) * 100);

      return {
        total: data?.total ?? 0,
        success: data?.success ?? 0,
        errors: Array.isArray(data?.errors) ? data.errors : [],
        unassigned: Array.isArray(data?.unassigned) ? data.unassigned : []
      };
    } catch (error) {
      console.error(`Error processing chunk ${chunkIndex + 1}:`, error);
      
      // If we haven't exceeded max retries, wait and try again
      if (retryCount < 3) {
        const backoffDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.log(`Retrying chunk ${chunkIndex + 1} after ${backoffDelay}ms...`);
        await delay(backoffDelay);
        return processChunkWithRetry(chunk, chunkIndex, totalChunks, retryCount + 1);
      }
      
      throw error;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setProgress(0);
      setSummary(null);

      // Split the file into chunks
      const chunks = await splitXMLFile(file);
      setChunkProgress({ current: 0, total: chunks.length });
      
      console.log(`File split into ${chunks.length} chunks`);

      let totalProcessed = 0;
      let totalSuccess = 0;
      let totalErrors: { link: string; error: string }[] = [];
      let totalUnassigned: string[] = [];

      // Process each chunk sequentially with delay between chunks
      for (let i = 0; i < chunks.length; i++) {
        const result = await processChunkWithRetry(chunks[i], i, chunks.length);
        
        totalProcessed += result.total;
        totalSuccess += result.success;
        totalErrors = [...totalErrors, ...result.errors];
        totalUnassigned = [...totalUnassigned, ...result.unassigned];

        // Add delay between chunks to allow for GC
        if (i < chunks.length - 1) {
          await delay(1000);
        }
      }

      const finalSummary: ImportSummary = {
        total: totalProcessed,
        success: totalSuccess,
        errors: totalErrors,
        unassigned: totalUnassigned
      };

      setSummary(finalSummary);

      if (totalSuccess > 0) {
        toast.success(`Successfully imported ${totalSuccess} smart links`);
      }

      if (totalErrors.length > 0) {
        toast.error(`Failed to import ${totalErrors.length} smart links`);
      }

      if (totalUnassigned.length > 0) {
        toast.warning(`${totalUnassigned.length} smart links were unassigned`);
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
