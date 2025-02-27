
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/sitemap-utils.ts';

export const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Check for proper authorization
    const authHeader = req.headers.get('Authorization') || '';
    
    // Parse request body for sitemap URL
    const { sitemapUrl } = await req.json();
    const encodedSitemapUrl = encodeURIComponent(sitemapUrl || 'https://soundraiser.io/sitemap.xml');
    
    console.log(`Pinging search engines with sitemap URL: ${sitemapUrl}`);
    
    // Initialize Supabase admin client for logging
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
    
    // Search engines to ping
    const engines = [
      {
        name: 'Google',
        url: `https://www.google.com/ping?sitemap=${encodedSitemapUrl}`
      },
      {
        name: 'Bing',
        url: `https://www.bing.com/ping?sitemap=${encodedSitemapUrl}`
      }
    ];
    
    // Ping each search engine
    const results = await Promise.all(engines.map(async (engine) => {
      try {
        const response = await fetch(engine.url, { method: 'GET' });
        const success = response.ok;
        
        return {
          engine: engine.name,
          success,
          status: response.status,
          statusText: response.statusText
        };
      } catch (error) {
        return {
          engine: engine.name,
          success: false,
          error: error.message
        };
      }
    }));
    
    // Log results
    const successCount = results.filter(r => r.success).length;
    
    try {
      await supabase
        .from('sitemap_logs')
        .insert({
          status: successCount > 0 ? 'success' : 'warning',
          message: `Pinged ${successCount}/${engines.length} search engines`,
          source: 'ping-search-engines',
          details: {
            results,
            sitemap_url: sitemapUrl
          }
        });
    } catch (logError) {
      console.error(`Failed to log search engine ping results: ${logError.message}`);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Pinged ${successCount}/${engines.length} search engines successfully`,
        results
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
    
  } catch (error) {
    console.error(`Error pinging search engines: ${error.message}`);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error pinging search engines: ${error.message}`
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
};
