
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function SpotifyPopularityBackfill() {
  const [batchSize, setBatchSize] = useState(10);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [lastProcessedId, setLastProcessedId] = useState<string | null>(null);
  const [skipIds, setSkipIds] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processed, setProcessed] = useState(0);
  const [totalEstimate, setTotalEstimate] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const runBackfill = async () => {
    try {
      setIsRunning(true);
      setError(null);
      addLog("Starting Spotify popularity backfill process...");
      
      // First, get an estimate of total links to process
      const { count } = await supabase
        .from('smart_links')
        .select('*', { count: 'exact', head: true })
        .in('user_id', (await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('tier', 'pro')
          .then(result => result.data?.map(sub => sub.user_id) || [])
        ));
        
      setTotalEstimate(count || 0);
      addLog(`Estimated total links to process: ${count}`);
      
      let complete = false;
      let currentLastId = lastProcessedId;
      let currentSkipIds = [...skipIds];
      let totalProcessed = processed;
      
      while (!complete) {
        addLog(`Processing batch with lastId: ${currentLastId || 'none'}, skipping ${currentSkipIds.length} links`);
        
        const { data, error } = await supabase.functions.invoke('backfill-spotify-popularity', {
          body: { 
            batchSize: batchSize, 
            startFromId: currentLastId,
            skipIds: currentSkipIds
          }
        });
        
        if (error) {
          throw new Error(`Function error: ${error.message}`);
        }
        
        if (!data.success) {
          throw new Error(`API error: ${data.error}`);
        }
        
        // Update progress
        totalProcessed += data.processedCount || 0;
        setProcessed(totalProcessed);
        
        if (totalEstimate > 0) {
          const calculatedProgress = Math.min(100, Math.round((totalProcessed / totalEstimate) * 100));
          setProgress(calculatedProgress);
        }
        
        // Log results
        addLog(`Processed ${data.processedCount} links, updated ${data.updates?.length} scores`);
        
        if (data.errors && data.errors.length > 0) {
          addLog(`Encountered ${data.errors.length} errors`);
          // Add failed IDs to skip list
          currentSkipIds = [...currentSkipIds, ...data.errors.map(e => e.linkId)];
          setSkipIds(currentSkipIds);
        }
        
        // Update last processed ID for next batch
        currentLastId = data.lastProcessedId;
        setLastProcessedId(currentLastId);
        
        // Check if complete
        complete = data.complete || false;
        
        if (complete) {
          setIsComplete(true);
          addLog("Backfill process complete!");
          break;
        }
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      addLog(`Error: ${errorMessage}`);
    } finally {
      setIsRunning(false);
    }
  };
  
  const resetProcess = () => {
    setIsComplete(false);
    setLastProcessedId(null);
    setSkipIds([]);
    setLogs([]);
    setProgress(0);
    setProcessed(0);
    setError(null);
  };
  
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().substring(11, 19);
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Spotify Popularity Backfill</CardTitle>
        <CardDescription>
          Populate historical Spotify popularity data for all Pro users' smart links
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batchSize">Batch Size</Label>
            <Input
              id="batchSize"
              type="number"
              value={batchSize}
              onChange={(e) => setBatchSize(parseInt(e.target.value) || 10)}
              disabled={isRunning}
              min={1}
              max={50}
            />
            <p className="text-sm text-muted-foreground">
              Number of links to process in each batch (1-50)
            </p>
          </div>
          
          {totalEstimate > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">
                  {processed} / ~{totalEstimate} links
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          {error && (
            <div className="bg-destructive/15 p-4 rounded-md flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          
          {isComplete && !error && (
            <div className="bg-primary/15 p-4 rounded-md flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-primary">Backfill process completed successfully!</p>
            </div>
          )}
          
          <div className="border rounded-md">
            <div className="bg-muted p-2 rounded-t-md border-b">
              <h3 className="text-sm font-medium">Logs</h3>
            </div>
            <div className="p-2 h-48 overflow-y-auto font-mono text-xs bg-black text-white">
              {logs.length === 0 ? (
                <p className="text-gray-500 italic">Logs will appear here...</p>
              ) : (
                logs.map((log, i) => <div key={i}>{log}</div>)
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={resetProcess} disabled={isRunning}>
          Reset
        </Button>
        <Button onClick={runBackfill} disabled={isRunning}>
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            'Run Backfill'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
