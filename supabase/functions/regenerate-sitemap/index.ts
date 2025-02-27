
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Define CORS headers 
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Content-Type': 'application/json'
}

// Helper to generate the sitemap for static pages
const generateStaticSitemap = () => {
  const date = new Date().toISOString().split('T')[0];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://soundraiser.io/</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://soundraiser.io/pricing</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://soundraiser.io/spotify-playlist-promotion</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://soundraiser.io/spotify-royalty-calculator</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://soundraiser.io/blog</loc>
    <lastmod>${date}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://soundraiser.io/create</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://soundraiser.io/login</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://soundraiser.io/register</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>`;
}

// Helper to generate sitemap index
const generateSitemapIndex = (sitemapFiles) => {
  const date = new Date().toISOString().split('T')[0];
  const sitemaps = sitemapFiles.map(file => 
    `  <sitemap>
    <loc>https://soundraiser.io/sitemap-${file}.xml</loc>
    <lastmod>${date}</lastmod>
  </sitemap>`
  ).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Check for optional webhook key for added security
    const webhookKey = Deno.env.get('SITEMAP_WEBHOOK_KEY');
    if (webhookKey) {
      const authHeader = req.headers.get('x-api-key');
      if (authHeader !== webhookKey) {
        console.warn('Unauthorized regenerate-sitemap attempt');
        
        // Still return 200 to avoid leaking information, but log it
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Unauthorized request' 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders } 
          }
        );
      }
    }
    
    // Parse the request body to get parameters
    let body = {};
    try {
      if (req.body) {
        const bodyText = await req.text();
        if (bodyText) {
          body = JSON.parse(bodyText);
        }
      }
    } catch (e) {
      console.error('Error parsing request body:', e);
      body = {};
    }
    
    const type = body.type || 'all';
    const trigger = body.trigger || 'api';
    
    console.log(`Regenerating sitemap, type: ${type}, trigger: ${trigger}`);
    
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { persistSession: false }
      }
    );
    
    // Log the regeneration start
    await supabaseClient.from('sitemap_logs').insert({
      status: 'success',
      message: `Started sitemap generation [${type}]`,
      source: `regenerate-sitemap-${trigger}`,
      details: { 
        type,
        trigger,
        timestamp: new Date().toISOString()
      }
    });
    
    // Generate static sitemap
    const staticSitemap = generateStaticSitemap();
    
    // Generate blog posts sitemap (simplified version)
    let blogSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    
    // Fetch blog posts
    const { data: blogPosts, error: blogError } = await supabaseClient
      .from('blog_posts')
      .select('slug, published_at, updated_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    
    if (blogError) {
      console.error('Error fetching blog posts for sitemap:', blogError);
    } else if (blogPosts && blogPosts.length > 0) {
      blogPosts.forEach(post => {
        const date = (post.updated_at || post.published_at || new Date().toISOString()).split('T')[0];
        blogSitemap += `
  <url>
    <loc>https://soundraiser.io/blog/${post.slug}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      });
    }
    
    blogSitemap += `
</urlset>`;
    
    // Generate smart links sitemap (simplified version)
    let linksSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    
    // Fetch smart links
    const { data: smartLinks, error: linksError } = await supabaseClient
      .from('smart_links')
      .select('slug, updated_at')
      .is('slug', 'not.null')
      .order('updated_at', { ascending: false });
    
    if (linksError) {
      console.error('Error fetching smart links for sitemap:', linksError);
    } else if (smartLinks && smartLinks.length > 0) {
      smartLinks.forEach(link => {
        const date = (link.updated_at || new Date().toISOString()).split('T')[0];
        linksSitemap += `
  <url>
    <loc>https://soundraiser.io/link/${link.slug}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      });
    }
    
    linksSitemap += `
</urlset>`;
    
    // Store the generated sitemaps in the cache
    const etag = Math.random().toString(36).substring(2);
    const timestamp = new Date().toISOString();
    
    // Store based on requested type
    const sitemapFiles = [];
    
    if (type === 'all' || type === 'static') {
      await supabaseClient.from('sitemap_cache').upsert({
        key: 'sitemap-static.xml',
        content: staticSitemap,
        etag,
        updated_at: timestamp
      });
      sitemapFiles.push('static');
    }
    
    if (type === 'all' || type === 'blog') {
      await supabaseClient.from('sitemap_cache').upsert({
        key: 'sitemap-blog.xml',
        content: blogSitemap,
        etag,
        updated_at: timestamp
      });
      sitemapFiles.push('blog');
    }
    
    if (type === 'all' || type === 'links') {
      await supabaseClient.from('sitemap_cache').upsert({
        key: 'sitemap-links.xml',
        content: linksSitemap,
        etag,
        updated_at: timestamp
      });
      sitemapFiles.push('links');
    }
    
    // If regenerating all, also update the sitemap index
    if (type === 'all') {
      const sitemapIndex = generateSitemapIndex(['static', 'blog', 'links']);
      await supabaseClient.from('sitemap_cache').upsert({
        key: 'sitemap-index.xml',
        content: sitemapIndex,
        etag,
        updated_at: timestamp
      });
    }
    
    // Log the successful generation
    await supabaseClient.from('sitemap_logs').insert({
      status: 'success',
      message: `Completed sitemap generation [${type}]`,
      source: `regenerate-sitemap-${trigger}`,
      details: { 
        type,
        trigger,
        sitemaps_generated: sitemapFiles,
        timestamp
      }
    });
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sitemap generation complete for ${type}`, 
        files: sitemapFiles
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders } 
      }
    );
    
  } catch (error) {
    // Log the error
    console.error('Error in regenerate-sitemap function:', error);
    
    // Try to log to database
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        {
          auth: { persistSession: false }
        }
      );
      
      await supabaseClient.from('sitemap_logs').insert({
        status: 'error',
        message: 'Error during sitemap generation',
        source: 'regenerate-sitemap-function',
        details: { 
          error: error.message,
          stack: error.stack
        }
      });
    } catch (logError) {
      console.error('Failed to log error to database:', logError);
    }
    
    // Return error response
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Error generating sitemap', 
        error: error.message 
      }),
      { 
        status: 200, // Still return 200 to avoid triggering webhook retries
        headers: { ...corsHeaders } 
      }
    );
  }
});
