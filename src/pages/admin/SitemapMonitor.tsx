
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function SitemapMonitor() {
  const [sitemapHealth, setSitemapHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkSitemapHealth();
  }, []);

  const checkSitemapHealth = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sitemap-health');
      
      if (error) {
        throw error;
      }
      
      setSitemapHealth(data);
    } catch (error) {
      console.error('Error checking sitemap health:', error);
      toast.error('Failed to check sitemap health');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIndicator = (status: string) => {
    if (!status) return null;
    
    switch (status.toLowerCase()) {
      case 'ok':
        return <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>;
      case 'warning':
        return <span className="inline-block w-3 h-3 bg-amber-500 rounded-full mr-2"></span>;
      case 'error':
        return <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>;
      default:
        return <span className="inline-block w-3 h-3 bg-gray-500 rounded-full mr-2"></span>;
    }
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sitemap Health Monitor</h1>
        <Button 
          variant="outline" 
          onClick={checkSitemapHealth} 
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Checking...' : 'Check Now'}
        </Button>
      </div>

      {!sitemapHealth ? (
        <Card>
          <CardContent className="py-6">
            <div className="text-center text-muted-foreground">
              {isLoading ? 'Checking sitemap health...' : 'No health data available'}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                {getStatusIndicator(sitemapHealth.status)}
                Overall Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold mb-2 capitalize">
                {sitemapHealth.status || 'Unknown'}
              </div>
              <p className="text-muted-foreground">
                {sitemapHealth.message || 'No status message available'}
              </p>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Last checked</span>
                  <span className="font-medium">
                    {sitemapHealth.checks_performed_at 
                      ? format(new Date(sitemapHealth.checks_performed_at), 'PPp')
                      : 'Unknown'}
                  </span>
                </div>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => window.open('https://soundraiser.io/sitemap.xml', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Sitemap
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Sitemap Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">URL Count</div>
                  <div className="text-xl font-semibold">
                    {sitemapHealth.url_count !== undefined ? sitemapHealth.url_count.toLocaleString() : 'Unknown'}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Last Updated</div>
                  <div className="text-lg font-medium">
                    {sitemapHealth.last_updated 
                      ? format(new Date(sitemapHealth.last_updated), 'PPp') 
                      : 'Never updated'}
                  </div>
                  {sitemapHealth.recency?.age_hours !== null && (
                    <div className={`text-sm ${sitemapHealth.recency.age_hours > 24 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                      {sitemapHealth.recency.age_hours < 1 
                        ? 'Updated less than an hour ago'
                        : `${sitemapHealth.recency.age_hours} hours ago`}
                    </div>
                  )}
                </div>
                
                {sitemapHealth.recent_errors && sitemapHealth.recent_errors.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm font-medium text-red-600 mb-2">Recent Errors</div>
                    <ul className="text-sm space-y-2">
                      {sitemapHealth.recent_errors.slice(0, 2).map((error: any, index: number) => (
                        <li key={index} className="p-2 bg-red-50 rounded border border-red-100">
                          <div className="font-medium">{error.message}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {error.created_at && format(new Date(error.created_at), 'Pp')}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
