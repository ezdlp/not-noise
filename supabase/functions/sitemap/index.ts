
// sitemap edge function - serves the cached XML sitemap

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Main handler function
export const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  console.log('Sitemap request received');
  
  // Initialize Supabase client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_ANON_KEY') || ''
  );
  
  try {
    // Get If-None-Match header (for ETag comparison)
    const ifNoneMatch = req.headers.get('If-None-Match') || '';
    
    // Fetch the cached sitemap
    const { data: sitemapData, error: sitemapError } = await supabase
      .from('sitemap_cache')
      .select('content, etag, updated_at')
      .eq('key', 'sitemap.xml')
      .single();
    
    if (sitemapError) {
      console.error(`Error fetching sitemap: ${sitemapError.message}`);
      throw new Error(`Failed to retrieve sitemap: ${sitemapError.message}`);
    }
    
    if (!sitemapData || !sitemapData.content) {
      console.error('No sitemap found in cache');
      
      // Initialize the admin client to trigger generation
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') || '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      );
      
      // Log the error
      await supabaseAdmin
        .from('sitemap_logs')
        .insert({
          status: 'warning',
          message: 'No sitemap in cache, returning fallback and triggering generation',
          source: 'sitemap',
          details: { requestedAt: new Date().toISOString() }
        });
      
      // Trigger sitemap generation in the background
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/sitemap-cache`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ source: 'sitemap-endpoint', trigger: 'missing-cache' })
      }).catch(err => console.error('Failed to trigger sitemap generation:', err));
      
      // Return a valid but simple sitemap
      const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Sitemap is being generated, please check back in a few minutes -->
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
          'Content-Type': 'application/xml; charset=UTF-8',
          'Cache-Control': 'public, max-age=300'
        }
      });
    }
    
    // Check if ETag matches (for 304 Not Modified response)
    if (ifNoneMatch === `"${sitemapData.etag}"`) {
      console.log('ETag matches, returning 304 Not Modified');
      return new Response(null, {
        status: 304,
        headers: {
          ...corsHeaders,
          'ETag': `"${sitemapData.etag}"`,
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
        }
      });
    }
    
    console.log(`Serving sitemap from cache, last updated: ${sitemapData.updated_at}`);
    
    // Return the cached sitemap with appropriate headers
    return new Response(sitemapData.content, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=UTF-8',
        'ETag': `"${sitemapData.etag}"`,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
      }
    });
    
  } catch (error) {
    console.error(`Error serving sitemap: ${error.message}`);
    
    try {
      // Initialize Supabase admin client to log error
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') || '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      );
      
      // Log the error
      await supabaseAdmin
        .from('sitemap_logs')
        .insert({
          status: 'error',
          message: `Error serving sitemap: ${error.message}`,
          source: 'sitemap',
          details: { error: error.stack || 'No stack trace available' }
        });
    } catch (logError) {
      console.error(`Failed to log error: ${logError.message}`);
    }
    
    // For errors, return a simple XML sitemap that's still valid
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Sitemap error: ${error.message} -->
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
        'Content-Type': 'application/xml; charset=UTF-8',
        'Cache-Control': 'public, max-age=300'
      }
    });
  }
};
