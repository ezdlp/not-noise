
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { RefreshCw, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistance } from 'date-fns';

// Define local interface for partial cache items that doesn't require content field
interface SitemapCacheItem {
  key: string;
  updated_at: string;
  etag: string;
  created_at: string;
}

// Using a more flexible interface for logs that accepts any string status
interface SitemapLog {
  id: string;
  status: string; // Changed from 'success' | 'error' | 'warning' to allow any string
  message: string;
  source: string;
  created_at: string;
  details: Record<string, any>;
}

export default function SitemapManagement() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationType, setGenerationType] = useState('all');
  const [sitemapCache, setSitemapCache] = useState<SitemapCacheItem[]>([]);
  const [sitemapLogs, setSitemapLogs] = useState<SitemapLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSitemapData();
  }, []);

  const fetchSitemapData = async () => {
    setIsLoading(true);
    try {
      // Fetch sitemap cache data
      const { data: cacheData, error: cacheError } = await supabase
        .from('sitemap_cache')
        .select('key, updated_at, etag, created_at')
        .order('updated_at', { ascending: false });

      if (cacheError) throw cacheError;
      setSitemapCache(cacheData || []);

      // Fetch sitemap logs
      const { data: logsData, error: logsError } = await supabase
        .from('sitemap_logs')
        .select('id, status, message, source, created_at, details')
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsError) throw logsError;
      setSitemapLogs(logsData || []);

    } catch (error) {
      console.error('Error fetching sitemap data:', error);
      toast.error('Failed to load sitemap data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSitemap = async () => {
    setIsGenerating(true);
    try {
      // Call the sitemap-generator function to regenerate sitemaps
      const { error } = await supabase.functions.invoke('sitemap-generator', {
        body: { 
          type: generationType === 'all' ? 'all' : 'file',
          filename: generationType !== 'all' ? `sitemap-${generationType}.xml` : undefined,
          trigger: 'manual-admin'
        }
      });

      if (error) throw error;
      
      toast.success(`Sitemap generation started for ${generationType === 'all' ? 'all types' : generationType}`);
      
      // Refresh data after a short delay to show new results
      setTimeout(() => {
        fetchSitemapData();
      }, 2000);
      
    } catch (error) {
      console.error('Error generating sitemap:', error);
      toast.error('Failed to generate sitemap');
    } finally {
      setIsGenerating(false);
    }
  };

  const pingSiteMapSearchEngines = async () => {
    try {
      const { error } = await supabase.functions.invoke('ping-search-engines', {
        body: { sitemapUrl: 'https://soundraiser.io/sitemap.xml' }
      });

      if (error) throw error;
      toast.success('Search engines pinged successfully');
      
      // Refresh data after a short delay
      setTimeout(() => {
        fetchSitemapData();
      }, 1000);
      
    } catch (error) {
      console.error('Error pinging search engines:', error);
      toast.error('Failed to ping search engines');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Success</span>;
      case 'error':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" /> Error</span>;
      case 'warning':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" /> Warning</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="container py-12">
      <h1 className="text-2xl font-bold mb-6">Sitemap Management</h1>
      
      <Tabs defaultValue="generate">
        <TabsList className="mb-4">
          <TabsTrigger value="generate">Generate Sitemaps</TabsTrigger>
          <TabsTrigger value="cache">Sitemap Cache</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Generate Sitemaps</CardTitle>
              <CardDescription>
                Generate or update your site's XML sitemaps to ensure search engines can discover all your content.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-base font-medium">What would you like to generate?</h3>
                <RadioGroup 
                  value={generationType} 
                  onValueChange={setGenerationType}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all">All sitemaps (complete regeneration)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="static" id="static" />
                    <Label htmlFor="static">Static pages sitemap only</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="blog" id="blog" />
                    <Label htmlFor="blog">Blog posts sitemap only</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="links" id="links" />
                    <Label htmlFor="links">Smart links sitemaps only</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800">
                <h3 className="font-medium flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" /> Important Note
                </h3>
                <p className="mt-1 text-sm">
                  Generating all sitemaps for a large site may take a few minutes. The process runs in the background, and you'll see the updated results in the "Sitemap Cache" tab when complete.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start sm:flex-row sm:justify-between sm:items-center gap-4">
              <Button 
                onClick={generateSitemap}
                disabled={isGenerating}
                className="w-full sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Generating...' : 'Generate Now'}
              </Button>
              
              <Button 
                variant="outline"
                onClick={pingSiteMapSearchEngines}
                className="w-full sm:w-auto"
              >
                Ping Search Engines
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="cache">
          <Card>
            <CardHeader>
              <CardTitle>Sitemap Cache</CardTitle>
              <CardDescription>
                View all the sitemap files currently cached in your system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : sitemapCache.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p>No sitemap files found in cache.</p>
                  <p className="text-sm mt-2">Generate a sitemap first using the "Generate Sitemaps" tab.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filename</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>ETag</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sitemapCache.map((item) => (
                      <TableRow key={item.key}>
                        <TableCell className="font-medium">{item.key}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistance(new Date(item.updated_at), new Date(), { addSuffix: true })}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs truncate max-w-[120px]">
                          {item.etag}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(`/sitemap${item.key === 'sitemap-index.xml' ? '' : `-${item.key.replace('sitemap-', '').replace('.xml', '')}`}.xml`, '_blank')}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={fetchSitemapData} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Sitemap Activity Logs</CardTitle>
              <CardDescription>
                View recent sitemap generation and activity logs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : sitemapLogs.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p>No sitemap activity logs found.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sitemapLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell>{log.message}</TableCell>
                        <TableCell>{log.source}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistance(new Date(log.created_at), new Date(), { addSuffix: true })}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={fetchSitemapData} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Logs
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
