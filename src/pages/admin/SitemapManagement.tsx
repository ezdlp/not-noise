
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, CheckCircle, Info, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { SitemapLog } from '@/types/database';

interface SitemapCacheInfo {
  key: string;
  updated_at: string;
  etag: string;
  url_count?: number;
}

export default function SitemapManagement() {
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<SitemapCacheInfo | null>(null);
  const [logs, setLogs] = useState<SitemapLog[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch sitemap cache info
      const { data: cacheData } = await supabase
        .from('sitemap_cache')
        .select('*')
        .eq('key', 'sitemap.xml')
        .single();

      if (cacheData) {
        setCacheInfo({
          key: cacheData.key,
          updated_at: cacheData.updated_at,
          etag: cacheData.etag,
          url_count: cacheData.content.match(/<url>/g)?.length || 0
        });
      }

      // Fetch recent logs
      const { data: logsData } = await supabase
        .from('sitemap_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsData) {
        setLogs(logsData as SitemapLog[]);
      }
    } catch (error) {
      console.error('Error fetching sitemap data:', error);
      toast.error('Failed to load sitemap information');
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateSitemap = async () => {
    setIsRegenerating(true);
    try {
      const { error } = await supabase.functions.invoke('sitemap-cache', {
        body: { 
          source: 'admin-panel',
          trigger: 'manual'
        }
      });

      if (error) throw error;
      
      toast.success('Sitemap regeneration started');
      
      // Wait a moment then refetch to show progress
      setTimeout(fetchData, 2000);
    } catch (error) {
      console.error('Error regenerating sitemap:', error);
      toast.error('Failed to regenerate sitemap');
    } finally {
      setIsRegenerating(false);
    }
  };

  const pingSearchEngines = async () => {
    setIsPinging(true);
    try {
      const { error } = await supabase.functions.invoke('ping-search-engines', {
        body: { 
          source: 'admin-panel',
          trigger: 'manual'
        }
      });

      if (error) throw error;
      
      toast.success('Search engines notification sent');
      
      // Wait a moment then refetch to show progress
      setTimeout(fetchData, 2000);
    } catch (error) {
      console.error('Error pinging search engines:', error);
      toast.error('Failed to notify search engines');
    } finally {
      setIsPinging(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Success</Badge>;
      case 'error':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Error</Badge>;
      case 'warning':
        return <Badge variant="warning" className="flex items-center gap-1"><Info className="h-3 w-3" /> Warning</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sitemap Management</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData} 
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={pingSearchEngines}
            disabled={isPinging || isLoading}
          >
            <Search className={`h-4 w-4 mr-1 ${isPinging ? 'animate-pulse' : ''}`} />
            Ping Search Engines
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={regenerateSitemap}
            disabled={isRegenerating || isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRegenerating ? 'animate-spin' : ''}`} />
            Regenerate Sitemap
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
          <TabsTrigger value="overview">
            Overview
          </TabsTrigger>
          <TabsTrigger value="logs">
            Logs ({logs.filter(log => log.status === 'error').length > 0 ? '⚠️' : '✓'})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Sitemap Status</CardTitle>
              <CardDescription>
                Current status of your sitemap and XML configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!cacheInfo ? (
                <div className="p-4 bg-amber-50 text-amber-700 rounded-md border border-amber-200">
                  <h3 className="font-medium flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" /> Sitemap Not Found
                  </h3>
                  <p className="mt-1 text-sm">
                    No sitemap has been generated yet. Click the "Regenerate Sitemap" button to create one.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">Last Updated</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-semibold mb-1">
                          {formatDistanceToNow(new Date(cacheInfo.updated_at), { addSuffix: true })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(cacheInfo.updated_at), 'MMMM d, yyyy h:mm a')}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">URL Count</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-semibold mb-1">
                          {cacheInfo.url_count || 'Unknown'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total URLs in sitemap
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Access Information</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-muted rounded-md flex justify-between items-center">
                        <div>
                          <div className="font-mono text-sm">Sitemap URL</div>
                          <div className="text-sm text-muted-foreground">https://soundraiser.io/sitemap.xml</div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => window.open('https://soundraiser.io/sitemap.xml', '_blank')}>
                          View
                        </Button>
                      </div>
                      
                      <div className="p-3 bg-muted rounded-md flex justify-between items-center">
                        <div>
                          <div className="font-mono text-sm">Robots.txt</div>
                          <div className="text-sm text-muted-foreground">https://soundraiser.io/robots.txt</div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => window.open('https://soundraiser.io/robots.txt', '_blank')}>
                          View
                        </Button>
                      </div>
                      
                      <div className="p-3 bg-muted rounded-md">
                        <div className="font-mono text-sm mb-1">ETag</div>
                        <div className="text-sm font-mono break-all text-muted-foreground">
                          {cacheInfo.etag}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Sitemap Logs</CardTitle>
              <CardDescription>
                Recent activity and status messages for the sitemap system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-4 text-left font-medium">Time</th>
                      <th className="py-3 px-4 text-left font-medium">Status</th>
                      <th className="py-3 px-4 text-left font-medium">Source</th>
                      <th className="py-3 px-4 text-left font-medium">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-muted-foreground">
                          No logs found
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 align-top">
                            <div className="font-mono whitespace-nowrap">{format(new Date(log.created_at), 'yyyy-MM-dd')}</div>
                            <div className="text-xs text-muted-foreground">{format(new Date(log.created_at), 'HH:mm:ss')}</div>
                          </td>
                          <td className="py-3 px-4 align-top">
                            {getStatusBadge(log.status)}
                          </td>
                          <td className="py-3 px-4 align-top">{log.source}</td>
                          <td className="py-3 px-4 align-top">
                            <div>{log.message}</div>
                            {log.details && Object.keys(log.details).length > 0 && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {Object.entries(log.details).map(([key, value]) => (
                                  <div key={key} className="mt-0.5">
                                    <span className="font-medium">{key}:</span>{' '}
                                    {typeof value === 'object' 
                                      ? JSON.stringify(value).substring(0, 100) 
                                      : String(value).substring(0, 100)}
                                    {(typeof value === 'object' ? JSON.stringify(value).length > 100 : String(value).length > 100) && '...'}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
