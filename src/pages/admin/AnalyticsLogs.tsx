
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '../../components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface LogEntry {
  id: string;
  function_name: string;
  parameters: any;
  status: string;
  details: any;
  start_time: string;
  end_time: string | null;
  duration_ms: number | null;
  created_at: string;
}

const AnalyticsLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // Using the rpc call with a specific function name
      const { data, error } = await supabase.rpc('get_analytics_function_logs');
      
      if (error) {
        console.error('Error fetching logs:', error);
        toast.error('Failed to fetch logs');
        return;
      }
      
      // Check if data is an array before setting it
      if (Array.isArray(data)) {
        setLogs(data as LogEntry[]);
      } else {
        console.error('Unexpected data format:', data);
        setLogs([]);
      }
    } catch (error) {
      console.error('Error in fetchLogs:', error);
      toast.error('An error occurred while fetching logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return 'N/A';
    return format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'fallback':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const renderDetails = (details: any) => {
    if (!details) return 'No details available';
    
    try {
      // Convert to string if it's not already
      const detailsStr = typeof details === 'string' ? details : JSON.stringify(details, null, 2);
      
      return (
        <pre className="text-xs overflow-auto max-h-40 p-2 bg-gray-100 rounded">
          {detailsStr}
        </pre>
      );
    } catch (e) {
      return 'Error displaying details';
    }
  };

  const renderParameters = (parameters: any) => {
    if (!parameters) return 'No parameters';
    
    // Safely check if parameters has items before using map
    if (typeof parameters === 'object' && parameters !== null) {
      return (
        <div className="text-sm">
          {Object.entries(parameters).map(([key, value]) => (
            <div key={key} className="mb-1">
              <span className="font-semibold">{key}:</span>{' '}
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </div>
          ))}
        </div>
      );
    }
    
    // Fall back to string representation for other cases
    return String(parameters);
  };

  const renderFallbackData = (details: any) => {
    if (!details || typeof details !== 'object' || !details.fallback_data) {
      return 'No fallback data';
    }
    
    // Safe access to fallback_data
    const fallbackData = details.fallback_data;
    
    // Check if it's an array with items
    if (Array.isArray(fallbackData) && fallbackData.length > 0) {
      return (
        <div>
          <p className="mb-2 font-semibold">Fallback data available ({fallbackData.length} items)</p>
          <pre className="text-xs overflow-auto max-h-20 p-2 bg-gray-100 rounded">
            {JSON.stringify(fallbackData[0], null, 2)}
            {fallbackData.length > 1 && <p>...and {fallbackData.length - 1} more items</p>}
          </pre>
        </div>
      );
    }
    
    return 'Fallback data present but empty or invalid format';
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Analytics Function Logs</h1>
          <Button onClick={fetchLogs} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Logs'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Function Execution Logs</CardTitle>
            <CardDescription>
              View detailed logs of analytics function executions to diagnose issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="mb-4">
                  <Skeleton className="h-12 w-full mb-2" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))
            ) : (
              <div>
                {Array.isArray(logs) && logs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Function</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Parameters</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.function_name}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(log.status)}>
                              {log.status || 'unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatTime(log.start_time)}</TableCell>
                          <TableCell>
                            {log.duration_ms ? `${Math.round(log.duration_ms)}ms` : 'N/A'}
                          </TableCell>
                          <TableCell className="max-w-xs">{renderParameters(log.parameters)}</TableCell>
                          <TableCell className="max-w-md">
                            <Tabs defaultValue="details">
                              <TabsList>
                                <TabsTrigger value="details">Details</TabsTrigger>
                                {log.status === 'fallback' && (
                                  <TabsTrigger value="fallback">Fallback Data</TabsTrigger>
                                )}
                                {log.status === 'error' && (
                                  <TabsTrigger value="error">Error Info</TabsTrigger>
                                )}
                              </TabsList>
                              <TabsContent value="details" className="pt-2">
                                {renderDetails(log.details)}
                              </TabsContent>
                              {log.status === 'fallback' && (
                                <TabsContent value="fallback" className="pt-2">
                                  {renderFallbackData(log.details)}
                                </TabsContent>
                              )}
                              {log.status === 'error' && (
                                <TabsContent value="error" className="pt-2">
                                  {log.details && typeof log.details === 'object' ? (
                                    <pre className="text-xs overflow-auto max-h-40 p-2 bg-gray-100 rounded">
                                      {JSON.stringify(log.details, null, 2)}
                                    </pre>
                                  ) : (
                                    'No error details available'
                                  )}
                                </TabsContent>
                              )}
                            </Tabs>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-lg text-gray-500">No logs found</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Run some analytics functions first or check database configuration
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AnalyticsLogs;
