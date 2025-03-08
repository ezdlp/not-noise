
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, AlertCircle, BarChart } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  const [activeTab, setActiveTab] = useState("backfill");
  const [stats, setStats] = useState<{
    total: number;
    tracked: number;
    averageScore: number;
    recentUpdates: number;
  }>({
    total: 0,
    tracked: 0,
    averageScore: 0,
    recentUpdates: 0
  });
  const [trendData, setTrendData] = useState<{date: string, avgScore: number}[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch basic stats
      const { data: totalLinks, error: linksError } = await supabase
        .from('smart_links')
        .select('id', { count: 'exact' })
        .in('user_id', (await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('tier', 'pro')
          .then(result => result.data?.map(sub => sub.user_id) || [])
        ));
        
      const { data: trackedLinks, error: trackedError } = await supabase
        .from('spotify_popularity_history')
        .select('smart_link_id', { count: 'exact', head: true })
        // Fix: Using isNull instead of is
        .not('smart_link_id', 'is', null);
        
      const { data: scores, error: scoresError } = await supabase
        .from('spotify_popularity_history')
        .select('popularity_score');
        
      const totalScore = scores?.reduce((sum, item) => sum + item.popularity_score, 0) || 0;
      const avgScore = scores?.length ? Math.round(totalScore / scores.length) : 0;
        
      // Get recent updates in the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: recentData, error: recentError } = await supabase
        .from('spotify_popularity_history')
        .select('id', { count: 'exact', head: true })
        .gte('measured_at', sevenDaysAgo.toISOString());
      
      // Get trend data for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: trendingData, error: trendError } = await supabase
        .from('spotify_popularity_history')
        .select('measured_at, popularity_score')
        .gte('measured_at', thirtyDaysAgo.toISOString())
        .order('measured_at', { ascending: true });
        
      if (trendingData) {
        // Group by day and calculate average
        const grouped = trendingData.reduce((acc, item) => {
          const date = new Date(item.measured_at).toISOString().split('T')[0];
          if (!acc[date]) {
            acc[date] = { sum: 0, count: 0 };
          }
          acc[date].sum += item.popularity_score;
          acc[date].count += 1;
          return acc;
        }, {} as Record<string, {sum: number, count: number}>);
        
        const chartData = Object.keys(grouped).map(date => ({
          date,
          avgScore: Math.round(grouped[date].sum / grouped[date].count)
        }));
        
        setTrendData(chartData);
      }
      
      setStats({
        total: totalLinks?.length || 0,
        tracked: trackedLinks?.length || 0,
        averageScore: avgScore,
        recentUpdates: recentData?.length || 0
      });
      
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

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
      
      while (!complete && !error) {
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
          currentSkipIds = [...currentSkipIds, ...data.errors.map((e: any) => e.linkId)];
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
          // Refresh statistics after completion
          fetchStats();
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
        <CardTitle>Spotify Popularity Tracking</CardTitle>
        <CardDescription>
          Track and backfill Spotify popularity data for Pro users' smart links
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="backfill">Backfill Tool</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="backfill" className="space-y-4">
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
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {isComplete && !error && (
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle className="text-green-800">Success</AlertTitle>
                <AlertDescription className="text-green-700">
                  Backfill process completed successfully!
                </AlertDescription>
              </Alert>
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
          </TabsContent>
          
          <TabsContent value="stats">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Pro Links</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Links with Popularity Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.tracked}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stats.total ? `${Math.round((stats.tracked / stats.total) * 100)}% of total` : '0%'}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Average Popularity Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageScore}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Max score is 100
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Updates Last 7 Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.recentUpdates}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="trends">
            <div className="h-72 w-full">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }} 
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Popularity Score', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                    />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="avgScore" 
                      name="Avg. Popularity"
                      stroke="#6851FB" 
                      strokeWidth={2}
                      dot={{ r: 1 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No trend data available yet</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 text-sm text-muted-foreground">
              <p>The chart shows the average daily Spotify popularity score for all tracked Pro user tracks.</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={resetProcess} disabled={isRunning}>
          Reset
        </Button>
        <Button 
          onClick={runBackfill} 
          disabled={isRunning}
          className="bg-[#6851FB] hover:bg-[#4A47A5] text-white"
        >
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
