
// regenerate-sitemap edge function - trigger for cron job
// Triggers the sitemap-cache function to regenerate the sitemap

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

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
    // Validate the request
    const authHeader = req.headers.get('Authorization') || '';
    const providedApiKey = authHeader.replace('Bearer ', '');
    
    // Parse the request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      body = { source: 'unknown' };
    }
    
    const source = body.source || 'api';
    
    // Log the start
    await supabaseAdmin
      .from('sitemap_logs')
      .insert({
        status: 'success',
        message: 'Triggered scheduled sitemap regeneration',
        source: 'regenerate-sitemap',
        details: { 
          trigger_source: source,
          scheduled: true
        }
      });
    
    console.log(`Triggering sitemap regeneration from ${source}`);
    
    // Call the sitemap-cache function
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/sitemap-cache`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        source: 'scheduled-job',
        trigger: 'cron'
      })
    });
    
    const responseStatus = response.status;
    const responseData = await response.text();
    
    console.log(`Sitemap regeneration triggered with status ${responseStatus}`);
    
    // Call the ping-search-engines function if sitemap generation was successful
    if (responseStatus >= 200 && responseStatus < 300) {
      console.log('Pinging search engines');
      
      try {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ping-search-engines`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            source: 'scheduled-job',
            trigger: 'cron-after-regeneration'
          })
        });
      } catch (pingError) {
        console.error('Error pinging search engines:', pingError);
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sitemap regeneration triggered',
        sitemap_response: {
          status: responseStatus,
          data: responseData.substring(0, 100) + (responseData.length > 100 ? '...' : '')
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
    
  } catch (error) {
    console.error('Error triggering sitemap regeneration:', error);
    
    // Log the error
    await supabaseAdmin
      .from('sitemap_logs')
      .insert({
        status: 'error',
        message: `Error triggering sitemap regeneration: ${error.message}`,
        source: 'regenerate-sitemap',
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
