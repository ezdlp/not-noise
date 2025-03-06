
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface LogEntry {
  id: string;
  function_name: string;
  parameters: Record<string, any>;
  status: string;
  details: Record<string, any>;
  start_time: string;
  end_time: string | null;
  duration_ms: number | null;
  created_at: string;
}

export default function AnalyticsLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use rpc to call the database function directly with type assertion
      const { data, error } = await supabase.rpc(
        'get_analytics_function_logs' as any, // Type assertion to bypass type checking temporarily
        { p_limit: 100 }
      );
      
      if (error) throw error;
      
      // Validate and transform the response data
      if (Array.isArray(data)) {
        // Make sure each entry has the expected shape
        const validatedLogs = data
          .filter((entry: any) => 
            typeof entry.id === 'string' && 
            typeof entry.function_name === 'string'
          )
          .map((entry: any) => ({
            id: entry.id,
            function_name: entry.function_name,
            parameters: entry.parameters || {},
            status: entry.status || 'Unknown',
            details: entry.details || {},
            start_time: entry.start_time,
            end_time: entry.end_time,
            duration_ms: entry.duration_ms,
            created_at: entry.created_at
          }));
        
        setLogs(validatedLogs);
      } else {
        setLogs([]);
        setError("Unexpected response format");
      }
    } catch (err) {
      console.error("Error fetching analytics logs:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Format duration as "X.XX ms" or "X.XX s" depending on value
  const formatDuration = (duration: number | null) => {
    if (duration === null) return "N/A";
    
    if (duration < 1000) {
      return `${duration.toFixed(2)} ms`;
    } else {
      return `${(duration / 1000).toFixed(2)} s`;
    }
  };

  // Pretty format JSON data
  const formatJson = (json: any) => {
    try {
      return JSON.stringify(json, null, 2);
    } catch (e) {
      return String(json);
    }
  };

  // Get status color for badges
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'fallback': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics Function Logs</h1>
        <Button 
          variant="outline" 
          onClick={fetchLogs} 
          disabled={loading}
          className="flex gap-2 items-center"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Function Execution Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-red-500">
              <p>Error loading logs: {error}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No logs found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{log.function_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(log.start_time).toLocaleString()}
                      </p>
                    </div>
                    <Badge className={getStatusColor(log.status)}>
                      {log.status || 'Unknown'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Duration</p>
                      <p>{formatDuration(log.duration_ms)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Parameters</p>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto text-xs">
                        {formatJson(log.parameters)}
                      </pre>
                    </div>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="col-span-1 md:col-span-2">
                        <p className="font-medium">Details</p>
                        <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto text-xs">
                          {formatJson(log.details)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
