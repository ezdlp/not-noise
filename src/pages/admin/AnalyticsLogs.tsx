
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

// Interface for analyticsLogs data
interface AnalyticsLog {
  id: string;
  function_name: string;
  parameters: any;
  status: string;
  details: any;
  start_time: string;
  end_time: string;
  duration_ms: number;
  created_at: string;
}

export default function AnalyticsLogs() {
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());

  const { data: logs, isLoading, refetch, error } = useQuery({
    queryKey: ["analytics-logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from('analytics_function_logs')
        .select('*')
        .order('start_time', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as AnalyticsLog[];
    },
  });

  // Toggle expanded state for a log entry
  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedLogIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedLogIds(newSet);
  };

  // Format the timestamp to a readable format
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Format JSON objects for display
  const formatJson = (json: any) => {
    if (!json) return "None";
    try {
      return JSON.stringify(json, null, 2);
    } catch (error) {
      return String(json);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'fallback':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Analytics Function Logs</h1>
          <Skeleton className="h-10 w-20" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Analytics Function Logs</h1>
          <Button onClick={() => refetch()} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <Card className="p-6 bg-red-50 border border-red-200">
          <h2 className="text-lg font-medium text-red-800 mb-2">Error Loading Logs</h2>
          <p className="text-red-600">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Analytics Function Logs</h1>
        <Button onClick={() => refetch()} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {logs && logs.length > 0 ? (
        <Card className="w-full overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Function Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: AnalyticsLog) => (
                <React.Fragment key={log.id}>
                  <TableRow>
                    <TableCell className="font-medium">{log.function_name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(log.status)}`}>
                        {log.status || 'pending'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {log.duration_ms !== null ? `${log.duration_ms.toFixed(2)}ms` : 'N/A'}
                    </TableCell>
                    <TableCell>{formatTimestamp(log.start_time)}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleExpand(log.id)}
                      >
                        {expandedLogIds.has(log.id) ? 'Hide Details' : 'Show Details'}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedLogIds.has(log.id) && (
                    <TableRow>
                      <TableCell colSpan={5} className="bg-slate-50 border-t-0">
                        <div className="p-3 space-y-4">
                          {log.parameters && (
                            <div>
                              <h3 className="text-sm font-semibold mb-1">Parameters:</h3>
                              <pre className="text-xs bg-slate-100 p-3 rounded overflow-auto max-h-40">
                                {formatJson(log.parameters)}
                              </pre>
                            </div>
                          )}
                          {log.details && (
                            <div>
                              <h3 className="text-sm font-semibold mb-1">Details:</h3>
                              <pre className="text-xs bg-slate-100 p-3 rounded overflow-auto max-h-40">
                                {formatJson(log.details)}
                              </pre>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-semibold">Start Time:</span>{' '}
                              {formatTimestamp(log.start_time)}
                            </div>
                            {log.end_time && (
                              <div>
                                <span className="font-semibold">End Time:</span>{' '}
                                {formatTimestamp(log.end_time)}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="p-6 text-center">
          <p className="text-gray-500">No logs found. Analytics functions may not have been executed yet.</p>
        </Card>
      )}
    </div>
  );
}
