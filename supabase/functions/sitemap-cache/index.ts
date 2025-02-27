
// sitemap-cache edge function - generates and caches the site's XML sitemap

import { createClient } from '@supabase/supabase-js';
import { Database } from '../_shared/database.types';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml; charset=UTF-8',
};

// Main handler function
export const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Extract API key from request headers
    const authHeader = req.headers.get('Authorization') || '';
    
    // Initialize Supabase client with service role
    const supabaseAdmin = createClient<Database>(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
    
    // Create a log entry to track function execution
    await supabaseAdmin
      .from('sitemap_logs')
      .insert({
        status: 'success',
        message: 'Started sitemap generation',
        source: 'sitemap-cache',
        details: { method: 'manual', trigger: 'edge-function' }
      });
    
    console.log('Starting sitemap generation process');

    // Get total URL count
    const { data: urlCountData, error: urlCountError } = await supabaseAdmin.rpc('get_sitemap_url_count');
    
    if (urlCountError) {
      throw new Error(`Failed to get URL count: ${urlCountError.message}`);
    }
    
    const totalUrls = urlCountData?.total_urls || 0;
    console.log(`Found ${totalUrls} URLs to include in sitemap`);
    
    if (totalUrls === 0) {
      throw new Error('No URLs found for sitemap');
    }
    
    // Build XML sitemap
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Process URLs in batches of 1000
    const batchSize = 1000;
    const batches = Math.ceil(totalUrls / batchSize);
    
    for (let i = 0; i < batches; i++) {
      const offset = i * batchSize;
      
      const { data: urls, error: urlsError } = await supabaseAdmin.rpc(
        'get_sitemap_urls_paginated', 
        { p_offset: offset, p_limit: batchSize }
      );
      
      if (urlsError) {
        throw new Error(`Failed to get URLs (batch ${i+1}/${batches}): ${urlsError.message}`);
      }
      
      if (!urls || urls.length === 0) {
        console.warn(`No URLs returned for batch ${i+1}/${batches}`);
        continue;
      }
      
      // Add each URL to the sitemap
      for (const url of urls) {
        sitemap += '  <url>\n';
        sitemap += `    <loc>https://soundraiser.io${url.url}</loc>\n`;
        
        if (url.updated_at) {
          const lastmod = new Date(url.updated_at).toISOString().split('T')[0];
          sitemap += `    <lastmod>${lastmod}</lastmod>\n`;
        }
        
        sitemap += `    <changefreq>${url.changefreq}</changefreq>\n`;
        sitemap += `    <priority>${url.priority}</priority>\n`;
        sitemap += '  </url>\n';
      }
      
      console.log(`Processed batch ${i+1}/${batches} (${urls.length} URLs)`);
    }
    
    sitemap += '</urlset>';
    
    // Calculate ETag (simple hash of the content)
    const etag = await generateETag(sitemap);
    console.log(`Generated sitemap with ETag: ${etag}`);
    
    // Store the sitemap in the cache
    const { error: cacheError } = await supabaseAdmin
      .from('sitemap_cache')
      .upsert(
        { 
          key: 'sitemap.xml',
          content: sitemap,
          etag: etag,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'key' }
      );
    
    if (cacheError) {
      throw new Error(`Failed to cache sitemap: ${cacheError.message}`);
    }
    
    console.log('Successfully stored sitemap in cache');
    
    // Log success
    await supabaseAdmin
      .from('sitemap_logs')
      .insert({
        status: 'success',
        message: 'Successfully generated and cached sitemap',
        source: 'sitemap-cache',
        details: { 
          url_count: totalUrls,
          etag: etag,
          size_bytes: sitemap.length
        }
      });
    
    return new Response(sitemap, { 
      headers: {
        ...corsHeaders,
        'ETag': `"${etag}"`,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
      } 
    });
    
  } catch (error) {
    console.error(`Error generating sitemap: ${error.message}`);
    
    try {
      // Initialize Supabase client to log error
      const supabaseAdmin = createClient<Database>(
        Deno.env.get('SUPABASE_URL') || '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      );
      
      // Log the error
      await supabaseAdmin
        .from('sitemap_logs')
        .insert({
          status: 'error',
          message: `Error generating sitemap: ${error.message}`,
          source: 'sitemap-cache',
          details: { error: error.stack || 'No stack trace available' }
        });
    } catch (logError) {
      console.error(`Failed to log error: ${logError.message}`);
    }
    
    // For errors, return a simple XML sitemap that's still valid but empty
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Sitemap generation error: ${error.message} -->
  <url>
    <loc>https://soundraiser.io/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    
    return new Response(fallbackSitemap, { 
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=300'
      }
    });
  }
};

// Generate a simple ETag for the sitemap
async function generateETag(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
