
// ping-search-engines edge function
// Notifies major search engines about sitemap updates

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// List of search engines to ping
const searchEngines = [
  {
    name: 'Google',
    url: 'https://www.google.com/ping',
    queryParam: 'sitemap',
  },
  {
    name: 'Bing',
    url: 'https://www.bing.com/ping',
    queryParam: 'sitemap',
  }
];

// Main handler function
export const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Initialize Supabase admin client
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );
  
  try {
    // Parse the request body
    const body = await req.json();
    const source = body.source || 'api';
    const sitemapUrl = 'https://soundraiser.io/sitemap.xml';
    
    console.log(`Pinging search engines with sitemap URL: ${sitemapUrl}`);
    
    // Log the start of pinging
    await supabaseAdmin.from('sitemap_logs').insert({
      status: 'success',
      message: 'Started pinging search engines',
      source: 'ping-search-engines',
      details: { 
        trigger_source: source, 
        sitemap_url: sitemapUrl 
      }
    });
    
    // Ping each search engine
    const pingResults = await Promise.all(
      searchEngines.map(async (engine) => {
        try {
          const pingUrl = `${engine.url}?${engine.queryParam}=${encodeURIComponent(sitemapUrl)}`;
          console.log(`Pinging ${engine.name} at ${pingUrl}`);
          
          const response = await fetch(pingUrl, { method: 'GET' });
          const success = response.status >= 200 && response.status < 300;
          
          return {
            engine: engine.name,
            success,
            status: response.status,
            statusText: response.statusText,
          };
        } catch (error) {
          console.error(`Error pinging ${engine.name}:`, error);
          return {
            engine: engine.name,
            success: false,
            error: error.message,
          };
        }
      })
    );
    
    // Log the results
    const successCount = pingResults.filter(result => result.success).length;
    const allSuccess = successCount === searchEngines.length;
    
    await supabaseAdmin.from('sitemap_logs').insert({
      status: allSuccess ? 'success' : 'warning',
      message: `Completed pinging search engines: ${successCount}/${searchEngines.length} successful`,
      source: 'ping-search-engines',
      details: { 
        results: pingResults, 
        success_count: successCount,
        total_count: searchEngines.length
      }
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Completed pinging search engines: ${successCount}/${searchEngines.length} successful`,
        results: pingResults,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
    
  } catch (error) {
    console.error('Error pinging search engines:', error);
    
    // Log the error
    await supabaseAdmin.from('sitemap_logs').insert({
      status: 'error',
      message: `Error pinging search engines: ${error.message}`,
      source: 'ping-search-engines',
      details: { error: error.stack || 'No stack trace available' }
    });
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
