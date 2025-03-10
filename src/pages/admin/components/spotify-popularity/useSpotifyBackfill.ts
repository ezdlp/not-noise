
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface BackfillStats {
  total: number;
  tracked: number;
  averageScore: number;
  recentUpdates: number;
}

export function useSpotifyBackfill() {
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
  const [stats, setStats] = useState<BackfillStats>({
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

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().substring(11, 19);
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
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

  return {
    batchSize,
    setBatchSize,
    isRunning,
    logs,
    isComplete,
    progress,
    processed,
    totalEstimate,
    error,
    stats,
    trendData,
    runBackfill,
    resetProcess,
    fetchStats
  };
}
