
// sitemap-health edge function
// Checks sitemap health and returns status details

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

export const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Initialize Supabase client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_ANON_KEY') || ''
  );
  
  try {
    // Fetch sitemap cache info
    const { data: cacheData, error: cacheError } = await supabase
      .from('sitemap_cache')
      .select('*')
      .eq('key', 'sitemap.xml')
      .maybeSingle();
    
    if (cacheError) {
      throw new Error(`Failed to fetch sitemap cache: ${cacheError.message}`);
    }
    
    // Determine sitemap health status
    let healthStatus = 'unknown';
    let message = 'Unable to determine sitemap status';
    
    if (!cacheData) {
      healthStatus = 'error';
      message = 'No sitemap found in cache';
    } else {
      // Check sitemap age
      const updateTime = new Date(cacheData.updated_at);
      const now = new Date();
      const ageInHours = (now.getTime() - updateTime.getTime()) / (1000 * 60 * 60);
      
      // Analyze URL count
      const urlCount = cacheData.content.match(/<url>/g)?.length || 0;
      
      if (ageInHours > 24) {
        // Sitemap is older than 24 hours
        healthStatus = 'warning';
        message = `Sitemap is ${Math.floor(ageInHours)} hours old`;
      } else if (urlCount < 5) {
        // Very few URLs in sitemap
        healthStatus = 'warning';
        message = `Sitemap contains only ${urlCount} URLs`;
      } else {
        // Sitemap appears healthy
        healthStatus = 'ok';
        message = 'Sitemap is up to date';
      }
    }
    
    // Fetch recent error logs
    const { data: recentErrors, error: logsError } = await supabase
      .from('sitemap_logs')
      .select('*')
      .eq('status', 'error')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (logsError) {
      console.warn(`Failed to fetch sitemap logs: ${logsError.message}`);
    }
    
    // Check if there are recent errors within the last hour
    const hasRecentErrors = recentErrors?.some(log => {
      const logTime = new Date(log.created_at);
      const now = new Date();
      const ageInMinutes = (now.getTime() - logTime.getTime()) / (1000 * 60);
      return ageInMinutes < 60;
    });
    
    // Override health status if there are recent errors
    if (hasRecentErrors && healthStatus !== 'error') {
      healthStatus = 'warning';
      message = 'Recent errors detected in sitemap system';
    }
    
    // Prepare response data
    const healthData = {
      status: healthStatus,
      message: message,
      last_updated: cacheData?.updated_at || null,
      url_count: cacheData ? (cacheData.content.match(/<url>/g)?.length || 0) : 0,
      etag: cacheData?.etag || null,
      recency: {
        age_hours: cacheData 
          ? Math.round((new Date().getTime() - new Date(cacheData.updated_at).getTime()) / (1000 * 60 * 60) * 10) / 10
          : null
      },
      recent_errors: recentErrors || [],
      checks_performed_at: new Date().toISOString()
    };
    
    // Log the health check
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
    
    await supabaseAdmin
      .from('sitemap_logs')
      .insert({
        status: 'success',
        message: `Sitemap health check: ${healthStatus}`,
        source: 'sitemap-health',
        details: healthData
      });
    
    // Return health data in response
    return new Response(
      JSON.stringify(healthData),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300'
        }
      }
    );
    
  } catch (error) {
    console.error(`Error checking sitemap health: ${error.message}`);
    
    // Log the error
    try {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') || '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      );
      
      await supabaseAdmin
        .from('sitemap_logs')
        .insert({
          status: 'error',
          message: `Error checking sitemap health: ${error.message}`,
          source: 'sitemap-health',
          details: { error: error.stack || 'No stack trace available' }
        });
    } catch (logError) {
      console.error(`Failed to log error: ${logError.message}`);
    }
    
    // Return error in response
    return new Response(
      JSON.stringify({
        status: 'error',
        message: `Error checking sitemap health: ${error.message}`,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
};
