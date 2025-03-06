
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet } from 'lucide-react';

// Define the proper interface for log items
interface AnalyticsLog {
  id: string;
  created_at: string;
  function_name: string;
  status: 'success' | 'error' | 'warning';
  execution_time_ms: number;
  parameters?: Record<string, any>;
  details?: string;
  error_message?: string;
}

const AnalyticsLogs = () => {
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [searchTerm, setSearchTerm] = React.useState<string>('');

  // Fetch logs data
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['analytics-logs'],
    queryFn: async () => {
      try {
        // Fetch from analytics_events table
        const { data, error } = await supabase
          .from('analytics_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (error) throw error;
        
        // Convert to expected format
        const logs: AnalyticsLog[] = (data || []).map((log: any) => ({
          id: log.id || `id-${Math.random()}`,
          created_at: log.created_at || new Date().toISOString(),
          function_name: log.event_type || 'unknown',
          status: log.status || 'success',
          execution_time_ms: log.execution_time_ms || 0,
          parameters: log.event_data || {},
          details: log.details || '',
          error_message: log.error_message || ''
        }));
        
        return logs;
      } catch (error) {
        console.error('Error fetching logs data:', error);
        return [] as AnalyticsLog[];
      }
    }
  });

  // Filter logs based on filters
  const filteredLogs = React.useMemo(() => {
    if (!logsData) return [];
    
    return logsData.filter(log => {
      const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
      const matchesSearch = !searchTerm || 
        log.function_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesStatus && matchesSearch;
    });
  }, [logsData, statusFilter, searchTerm]);

  // Handle export CSV
  const exportToCSV = () => {
    if (!filteredLogs.length) return;
    
    const headers = ['ID', 'Timestamp', 'Function', 'Status', 'Execution Time (ms)', 'Details'];
    const csvData = filteredLogs.map(log => [
      log.id,
      new Date(log.created_at).toLocaleString(),
      log.function_name,
      log.status,
      log.execution_time_ms,
      log.details || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Function Logs</h1>
        <Button onClick={exportToCSV} variant="outline">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Logs</CardTitle>
          <CardDescription>View and filter function execution logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="w-full md:w-1/3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-2/3">
              <Input 
                placeholder="Search by function name or details..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              {Array(5).fill(null).map((_, i) => (
                <Skeleton key={i} className="w-full h-12" />
              ))}
            </div>
          ) : filteredLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Function</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Execution Time</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                    <TableCell>{log.function_name}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={log.status === 'error' ? 'destructive' : 
                                log.status === 'success' ? 'outline' : 
                                'secondary'}
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.execution_time_ms}ms</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {log.details || (log.error_message ? `Error: ${log.error_message}` : 'No details')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No logs found matching your filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsLogs;
