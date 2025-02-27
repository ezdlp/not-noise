
// sitemap edge function - serves the cached XML sitemap
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Fallback sitemap - actual sitemap being generated -->
  <url>
    <loc>https://soundraiser.io/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

// Main handler function
export const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
  
  console.log('Sitemap request received');
  
  // Initialize Supabase client - no auth required for public access
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
      
      // Log the error but don't require authentication
      try {
        const adminClient = createClient(
          Deno.env.get('SUPABASE_URL') || '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
        );
        
        await adminClient
          .from('sitemap_logs')
          .insert({
            status: 'warning',
            message: `Error fetching sitemap: ${sitemapError.message}`,
            source: 'sitemap',
            details: { 
              error_code: sitemapError.code,
              requestedAt: new Date().toISOString()
            }
          });
      } catch (logError) {
        console.error("Could not log error:", logError);
      }
      
      // Try to trigger sitemap generation in the background
      try {
        fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/sitemap-cache`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ source: 'sitemap-endpoint', trigger: 'error-fetch' })
        }).catch(err => console.error('Failed to trigger sitemap generation:', err));
      } catch (triggerError) {
        console.error("Could not trigger regeneration:", triggerError);
      }
      
      // Return a valid XML sitemap even in case of error
      return new Response(fallbackSitemap, { 
        headers: {
          'Content-Type': 'application/xml; charset=UTF-8',
          'Cache-Control': 'public, max-age=300',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
    
    if (!sitemapData || !sitemapData.content) {
      console.log('No sitemap found in cache, returning fallback');
      
      // Try to trigger sitemap generation in the background
      try {
        fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/sitemap-cache`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ source: 'sitemap-endpoint', trigger: 'missing-cache' })
        }).catch(err => console.error('Failed to trigger sitemap generation:', err));
      } catch (triggerError) {
        console.error("Could not trigger regeneration:", triggerError);
      }
      
      return new Response(fallbackSitemap, { 
        headers: {
          'Content-Type': 'application/xml; charset=UTF-8',
          'Cache-Control': 'public, max-age=300',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
    
    // Check if ETag matches (for 304 Not Modified response)
    if (ifNoneMatch === `"${sitemapData.etag}"`) {
      console.log('ETag matches, returning 304 Not Modified');
      return new Response(null, {
        status: 304,
        headers: {
          'Content-Type': 'application/xml; charset=UTF-8',
          'ETag': `"${sitemapData.etag}"`,
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
    
    console.log(`Serving sitemap from cache, last updated: ${sitemapData.updated_at}`);
    
    // Return the cached sitemap with appropriate headers
    return new Response(sitemapData.content, {
      headers: {
        'Content-Type': 'application/xml; charset=UTF-8',
        'ETag': `"${sitemapData.etag}"`,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      }
    });
    
  } catch (error) {
    console.error(`Error serving sitemap: ${error.message}`);
    
    // Return a valid XML sitemap even in case of error
    return new Response(fallbackSitemap, { 
      headers: {
        'Content-Type': 'application/xml; charset=UTF-8',
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
};
