
import { corsHeaders, xmlResponse, xmlErrorResponse, createAnonClient, SITE_URL } from '../_shared/sitemap-utils.ts';

// Fallback sitemap with just the homepage
const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

export const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get the sitemap key from URL
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    
    if (!path || !path.startsWith('sitemap-')) {
      return xmlErrorResponse('Invalid sitemap file requested', 400);
    }
    
    console.log(`Sitemap file request received for: ${path}`);
    
    // Initialize Supabase client with anonymous access
    const supabase = createAnonClient();
    
    // Get If-None-Match header for ETag comparison
    const ifNoneMatch = req.headers.get('If-None-Match') || '';
    
    // Try to fetch the requested sitemap file from cache
    const { data: sitemapData, error } = await supabase
      .from('sitemap_cache')
      .select('content, etag, updated_at')
      .eq('key', path)
      .single();
    
    if (error) {
      console.error(`Error fetching sitemap file ${path}: ${error.message}`);
      
      // Trigger background generation for this specific sitemap
      try {
        const { error: invocationError } = await supabase.functions.invoke('sitemap-generator', {
          body: { type: 'file', filename: path, trigger: 'fetch-error' }
        });
        
        if (invocationError) {
          console.error(`Error triggering regeneration: ${invocationError.message}`);
        }
      } catch (triggerError) {
        console.error(`Failed to trigger sitemap generation: ${triggerError.message}`);
      }
      
      // Return fallback sitemap for this specific file
      return xmlResponse(fallbackSitemap, { maxAge: 300 });
    }
    
    // If no sitemap file is found in cache
    if (!sitemapData || !sitemapData.content) {
      console.log(`No sitemap file found in cache for ${path}, returning fallback`);
      
      // Trigger background generation for this specific sitemap
      try {
        const { error: invocationError } = await supabase.functions.invoke('sitemap-generator', {
          body: { type: 'file', filename: path, trigger: 'missing-cache' }
        });
        
        if (invocationError) {
          console.error(`Error triggering regeneration: ${invocationError.message}`);
        }
      } catch (triggerError) {
        console.error(`Failed to trigger sitemap generation: ${triggerError.message}`);
      }
      
      return xmlResponse(fallbackSitemap, { maxAge: 300 });
    }
    
    // Check if ETag matches for 304 Not Modified response
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
    
    console.log(`Serving sitemap file ${path} from cache, last updated: ${sitemapData.updated_at}`);
    
    // Return the cached sitemap with appropriate headers
    return xmlResponse(sitemapData.content, { 
      etag: sitemapData.etag,
      maxAge: 3600
    });
    
  } catch (error) {
    console.error(`Error serving sitemap file: ${error.message}`);
    return xmlResponse(fallbackSitemap, { maxAge: 300 });
  }
};
