
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

// Constants for chunking
const CHUNK_SIZE = 500 * 1024; // 500KB per chunk
const MAX_RETRIES = 3;

export function ImportLinks() {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [testMode, setTestMode] = useState(true);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);

  const splitXmlContent = (content: string): string[] => {
    // Find XML prolog and root element
    const xmlProlog = content.substring(0, content.indexOf('<?xml'));
    const rootStart = content.substring(0, content.indexOf('<channel>') + 9);
    const rootEnd = '</channel></rss>';
    
    // Extract items using regex
    const itemRegex = /<item[\s\S]*?<\/item>/g;
    const items = Array.from(content.matchAll(itemRegex)).map(m => m[0]);
    
    if (items.length === 0) {
      return [content];
    }

    const chunks: string[] = [];
    let currentChunk = '';
    let currentSize = 0;

    for (const item of items) {
      const itemSize = new TextEncoder().encode(item).length;
      
      if (currentSize + itemSize > CHUNK_SIZE && currentChunk) {
        // Complete the current chunk with proper XML structure
        chunks.push(`${xmlProlog}${rootStart}${currentChunk}${rootEnd}`);
        currentChunk = item;
        currentSize = itemSize;
      } else {
        currentChunk += item;
        currentSize += itemSize;
      }
    }

    // Add the last chunk if there's remaining content
    if (currentChunk) {
      chunks.push(`${xmlProlog}${rootStart}${currentChunk}${rootEnd}`);
    }

    return chunks;
  };

  const processChunk = async (
    chunk: string, 
    batchId: string, 
    chunkIndex: number, 
    totalChunks: number
  ): Promise<void> => {
    const formData = new FormData();
    const blob = new Blob([chunk], { type: 'text/xml' });
    formData.append('file', blob, 'chunk.xml');
    formData.append('testMode', testMode.toString());
    formData.append('batchId', batchId);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());

    let retryCount = 0;
    let success = false;

    while (!success && retryCount < MAX_RETRIES) {
      try {
        const { data, error } = await supabase.functions.invoke('wordpress-smartlinks-import', {
          body: formData,
        });

        if (error) throw error;

        // Update progress based on chunk completion
        const chunkProgress = ((chunkIndex + 1) / totalChunks) * 100;
        setProgress(chunkProgress);

        success = true;
      } catch (error) {
        console.error(`Error processing chunk ${chunkIndex + 1}/${totalChunks}:`, error);
        retryCount++;
        
        if (retryCount === MAX_RETRIES) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setProgress(0);
      setSummary(null);

      // Read the file content
      const text = await file.text();
      const chunks = splitXmlContent(text);
      
      // Create an import batch
      const { data: batchData, error: batchError } = await supabase
        .from('import_batches')
        .insert({
          file_name: file.name,
          total_items: chunks.length,
          status: 'processing',
          processed_items: 0
        })
        .select()
        .single();

      if (batchError) throw batchError;
      
      const batchId = batchData.id;
      setCurrentBatchId(batchId);

      // Process chunks sequentially
      for (let i = 0; i < chunks.length; i++) {
        await processChunk(chunks[i], batchId, i, chunks.length);
      }

      // Get final import results
      const { data: importResults, error: resultsError } = await supabase
        .from('import_batches')
        .select(`
          *,
          import_logs (
            status,
            error_message,
            wp_post_id,
            smart_link_id
          )
        `)
        .eq('id', batchId)
        .single();

      if (resultsError) throw resultsError;

      // Calculate summary
      const logs = importResults.import_logs;
      const summary: ImportSummary = {
        total: logs.length,
        success: logs.filter(log => log.status === 'completed').length,
        errors: logs
          .filter(log => log.status === 'failed')
          .map(log => ({
            link: log.wp_post_id || 'Unknown',
            error: log.error_message || 'Unknown error'
          })),
        unassigned: logs
          .filter(log => log.status === 'completed' && !log.smart_link_id)
          .map(log => log.wp_post_id || 'Unknown')
      };

      setSummary(summary);

      if (summary.success > 0) {
        toast.success(`Successfully imported ${summary.success} smart links`);
      }

      if (summary.errors.length > 0) {
        toast.error(`Failed to import ${summary.errors.length} smart links`);
      }

      if (summary.unassigned.length > 0) {
        toast.warning(`${summary.unassigned.length} smart links were unassigned`);
      }

    } catch (error) {
      console.error("Error importing smart links:", error);
      toast.error("Failed to import smart links");
      
      // Update batch status if we have a batch ID
      if (currentBatchId) {
        await supabase
          .from('import_batches')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', currentBatchId);
      }
    } finally {
      setIsImporting(false);
      setCurrentBatchId(null);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
