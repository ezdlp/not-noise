
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function GenerateInitialSitemap() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{success: boolean; message: string} | null>(null);

  const generateSitemap = async () => {
    setIsGenerating(true);
    setResult(null);
    
    try {
      // Call the sitemap-cache function to generate initial sitemap
      const { error } = await supabase.functions.invoke('sitemap-cache', {
        method: 'POST',
        body: { 
          source: 'admin-panel',
          trigger: 'initial-generation'
        }
      });

      if (error) throw error;
      
      // Set success result
      setResult({
        success: true,
        message: 'Sitemap successfully generated! It should now be accessible at /sitemap.xml'
      });
      
      toast.success('Sitemap successfully generated');
      
    } catch (error) {
      console.error('Error generating sitemap:', error);
      
      // Set error result
      setResult({
        success: false,
        message: `Failed to generate sitemap: ${error.message || 'Unknown error'}`
      });
      
      toast.error('Failed to generate sitemap');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container py-12">
      <h1 className="text-2xl font-bold mb-6">Generate Initial Sitemap</h1>
      
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Sitemap Generator</CardTitle>
          <CardDescription>
            This utility will create the initial sitemap.xml file for your website.
            Use this if your sitemap is missing or needs to be completely regenerated.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800">
            <h3 className="font-medium flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" /> Important Note
            </h3>
            <p className="mt-1 text-sm">
              This will generate a new sitemap containing all your public pages, blog posts, and smart links.
              The sitemap will be cached and automatically served at <code>/sitemap.xml</code>.
            </p>
          </div>
          
          <Button 
            onClick={generateSitemap}
            disabled={isGenerating}
            className="w-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating Sitemap...' : 'Generate Sitemap Now'}
          </Button>
          
          {result && (
            <div className={`mt-6 border rounded-md p-4 ${result.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              {result.success ? (
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Success!</h3>
                    <p className="mt-1 text-sm">{result.message}</p>
                    <div className="mt-3">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => window.open('/sitemap.xml', '_blank')}
                      >
                        View Sitemap
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Error</h3>
                    <p className="mt-1 text-sm">{result.message}</p>
                    <p className="mt-2 text-sm">
                      Please try again or check the console for more details.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
