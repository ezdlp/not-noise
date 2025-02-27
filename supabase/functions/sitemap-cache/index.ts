
// sitemap-cache edge function - generates and caches the site's XML sitemap
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

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
  
  // For POST requests, require authentication to prevent unauthorized regeneration
  if (req.method === 'POST') {
    // Check for authentication header
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authentication for POST request');
      // Return XML error instead of JSON
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
        <error>
          <message>Authentication required for regeneration</message>
        </error>`,
        {
          status: 401,
          headers: {
            'Content-Type': 'application/xml; charset=UTF-8',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }
  }
  
  try {
    // Initialize Supabase client with service role
    const supabaseAdmin = createClient(
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
        details: { method: req.method, trigger: req.method === 'POST' ? 'manual' : 'auto' }
      });
    
    console.log('Starting sitemap generation process');

    // Generate static URLs
    const staticUrls = [
      { url: '/', priority: 1.0, changefreq: 'weekly' },
      { url: '/pricing', priority: 0.9, changefreq: 'weekly' },
      { url: '/spotify-playlist-promotion', priority: 0.9, changefreq: 'weekly' },
      { url: '/spotify-royalty-calculator', priority: 0.8, changefreq: 'monthly' },
      { url: '/blog', priority: 0.9, changefreq: 'daily' },
      { url: '/create', priority: 0.8, changefreq: 'weekly' },
      { url: '/login', priority: 0.6, changefreq: 'monthly' },
      { url: '/register', priority: 0.6, changefreq: 'monthly' },
    ];
    
    // Function to get blog post URLs
    async function getBlogPostUrls() {
      const { data, error } = await supabaseAdmin
        .from('blog_posts')
        .select('slug, published_at, updated_at')
        .eq('status', 'published');
      
      if (error) {
        console.error('Error fetching blog posts:', error);
        return [];
      }
      
      return data?.map(post => ({
        url: `/blog/${post.slug}`,
        lastmod: post.updated_at || post.published_at,
        priority: 0.8,
        changefreq: 'weekly'
      })) || [];
    }
    
    // Function to get smart link URLs
    async function getSmartLinkUrls() {
      const { data, error } = await supabaseAdmin
        .from('smart_links')
        .select('slug, updated_at')
        .not('slug', 'is', null);
      
      if (error) {
        console.error('Error fetching smart links:', error);
        return [];
      }
      
      return data?.map(link => ({
        url: `/link/${link.slug}`,
        lastmod: link.updated_at,
        priority: 0.7,
        changefreq: 'monthly'
      })) || [];
    }
    
    // Fetch dynamic URLs
    const [blogUrls, smartLinkUrls] = await Promise.all([
      getBlogPostUrls(),
      getSmartLinkUrls()
    ]);
    
    // Combine all URLs
    const allUrls = [...staticUrls, ...blogUrls, ...smartLinkUrls];
    
    // Build XML sitemap
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Add each URL to the sitemap
    for (const url of allUrls) {
      sitemap += '  <url>\n';
      sitemap += `    <loc>https://soundraiser.io${url.url}</loc>\n`;
      
      if (url.lastmod) {
        const lastmod = new Date(url.lastmod).toISOString().split('T')[0];
        sitemap += `    <lastmod>${lastmod}</lastmod>\n`;
      }
      
      sitemap += `    <changefreq>${url.changefreq}</changefreq>\n`;
      sitemap += `    <priority>${url.priority}</priority>\n`;
      sitemap += '  </url>\n';
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
          url_count: allUrls.length,
          etag: etag,
          size_bytes: sitemap.length
        }
      });
    
    // For direct access, return the sitemap
    return new Response(sitemap, { 
      headers: {
        'Content-Type': 'application/xml; charset=UTF-8',
        'ETag': `"${etag}"`,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      } 
    });
    
  } catch (error) {
    console.error(`Error generating sitemap: ${error.message}`);
    
    try {
      // Initialize Supabase client to log error
      const supabaseAdmin = createClient(
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
    
    // Return a simple valid XML response for errors
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
        'Content-Type': 'application/xml; charset=UTF-8',
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
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
