
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
import type { ImportSummary } from "@/types/database";

const MAX_CHUNK_SIZE = 500 * 1024; // 500KB chunks

export function ImportLinks() {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [testMode, setTestMode] = useState(true);

  const processChunk = async (chunk: string, chunkIndex: number, totalChunks: number) => {
    const formData = new FormData();
    const blob = new Blob([chunk], { type: 'text/xml' });
    formData.append('file', blob, 'chunk.xml');
    formData.append('testMode', testMode.toString());

    const { data, error } = await supabase.functions.invoke('wordpress-smartlinks-import', {
      body: formData,
    });

    if (error) throw error;
    setProgress(((chunkIndex + 1) / totalChunks) * 100);
    return data as ImportSummary;
  };

  const splitXmlContent = (content: string): string[] => {
    const itemRegex = /<item[\s\S]*?<\/item>/g;
    const xmlHeader = content.substring(0, content.indexOf('<item>'));
    const xmlFooter = content.substring(content.lastIndexOf('</item>') + 7);
    const items = content.match(itemRegex) || [];
    
    const chunks: string[] = [];
    let currentChunk = '';
    
    items.forEach((item) => {
      if ((currentChunk + item).length > MAX_CHUNK_SIZE) {
        if (currentChunk) {
          chunks.push(xmlHeader + currentChunk + xmlFooter);
        }
        currentChunk = item;
      } else {
        currentChunk += item;
      }
    });
    
    if (currentChunk) {
      chunks.push(xmlHeader + currentChunk + xmlFooter);
    }
    
    return chunks;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setProgress(0);

      const content = await file.text();
      const chunks = splitXmlContent(content);
      console.log(`Processing file in ${chunks.length} chunks`);

      let totalResults: ImportSummary = {
        total: 0,
        success: 0,
        errors: [],
        unassigned: []
      };

      for (let i = 0; i < chunks.length; i++) {
        const result = await processChunk(chunks[i], i, chunks.length);
        totalResults.total += result.total;
        totalResults.success += result.success;
        totalResults.errors.push(...result.errors);
        totalResults.unassigned.push(...result.unassigned);

        // Add delay between chunks
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      setSummary(totalResults);

      if (totalResults.success > 0) {
        toast.success(`Successfully imported ${totalResults.success} smart links`);
      }

      if (totalResults.errors.length > 0) {
        toast.error(`Failed to import ${totalResults.errors.length} smart links`);
      }

      if (totalResults.unassigned.length > 0) {
        toast.warning(`${totalResults.unassigned.length} smart links were unassigned`);
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
