
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { format } from 'https://deno.land/std@0.202.0/datetime/format.ts'

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Handler for the Edge Function
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Verify API key for security (optional)
    // We would check req.headers.get('x-api-key') === Deno.env.get('SITEMAP_API_KEY')
    
    console.log('Received request to regenerate sitemap');
    
    // Create a Supabase client with service role for admin access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );
    
    // Log the start of regeneration
    await supabase.from('sitemap_logs').insert({
      status: 'success',
      message: 'Started sitemap regeneration',
      source: 'regenerate-sitemap-function',
      details: { trigger: 'api-request' }
    });
    
    // Generate sitemaps (this might take time for large sites)
    const files = await generateSitemaps(supabase);
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sitemap regenerated successfully',
        files: files
      }), 
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
    
  } catch (error) {
    console.error('Error in regenerate-sitemap function:', error);
    
    // Log the error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
      );
      
      await supabase.from('sitemap_logs').insert({
        status: 'error',
        message: `Error in regenerate-sitemap function: ${error.message}`,
        source: 'regenerate-sitemap-function',
        details: { 
          error: error.message,
          stack: error.stack
        }
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error regenerating sitemap',
        error: error.message
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
});

// Function to generate all sitemaps
async function generateSitemaps(supabase) {
  const BATCH_SIZE = 1000;
  console.log("Starting sitemap generation");
  
  try {
    // Get total URL count from database
    const { data: countData, error: countError } = await supabase.rpc('get_sitemap_url_count');
    
    if (countError) {
      throw new Error(`Error getting URL count: ${countError.message}`);
    }
    
    const totalUrls = countData?.total_urls || 0;
    console.log(`Found ${totalUrls} URLs to include in sitemap`);
    
    // If no URLs, just create a static sitemap
    if (totalUrls === 0) {
      const staticSitemap = createSitemap([
        { url: '/', changefreq: 'weekly', priority: 1.0 }
      ]);
      
      // Save to cache
      await supabase
        .from('sitemap_cache')
        .upsert({ 
          key: 'sitemap-static.xml',
          content: staticSitemap,
          etag: crypto.randomUUID(),
          updated_at: new Date().toISOString()
        });
      
      // Create index
      const sitemapIndex = createSitemapIndex(['sitemap-static.xml']);
      
      // Save index to cache
      await supabase
        .from('sitemap_cache')
        .upsert({
          key: 'sitemap-index.xml',
          content: sitemapIndex,
          etag: crypto.randomUUID(),
          updated_at: new Date().toISOString()
        });
      
      return ['sitemap-static.xml'];
    }
    
    // Calculate number of sitemap files needed
    const totalFiles = Math.ceil(totalUrls / BATCH_SIZE);
    const sitemapFiles = [];
    
    // Process URLs in batches
    for (let i = 0; i < totalFiles; i++) {
      const offset = i * BATCH_SIZE;
      const batch = Math.min(BATCH_SIZE, totalUrls - offset);
      
      console.log(`Processing batch ${i+1}/${totalFiles} (offset ${offset}, limit ${batch})`);
      
      // Get URLs for this batch using our fixed function
      const { data: urls, error: urlsError } = await supabase.rpc(
        'get_sitemap_urls_fixed', 
        { p_offset: offset, p_limit: batch }
      );
      
      if (urlsError) {
        throw new Error(`Error getting URLs for batch ${i+1}: ${urlsError.message}`);
      }
      
      if (!urls || urls.length === 0) {
        console.log(`No URLs returned for batch ${i+1}`);
        continue;
      }
      
      // Determine sitemap type based on batch
      const sitemapType = i === 0 ? 'static' : `part${i}`;
      const filename = `sitemap-${sitemapType}.xml`;
      sitemapFiles.push(filename);
      
      // Create and save sitemap for this batch
      const sitemap = createSitemap(urls);
      
      await supabase
        .from('sitemap_cache')
        .upsert({
          key: filename,
          content: sitemap,
          etag: crypto.randomUUID(),
          updated_at: new Date().toISOString()
        });
      
      console.log(`Saved sitemap file: ${filename}`);
    }
    
    // Create and save sitemap index
    const sitemapIndex = createSitemapIndex(sitemapFiles);
    
    await supabase
      .from('sitemap_cache')
      .upsert({
        key: 'sitemap-index.xml',
        content: sitemapIndex,
        etag: crypto.randomUUID(),
        updated_at: new Date().toISOString()
      });
    
    console.log('Saved sitemap index file');
    
    // Log successful generation
    await supabase.from('sitemap_logs').insert({
      status: 'success',
      message: `Generated ${sitemapFiles.length} sitemap files`,
      source: 'regenerate-sitemap-function',
      details: { files: sitemapFiles }
    });
    
    // Return list of generated files
    return sitemapFiles;
    
  } catch (error) {
    console.error('Error generating sitemaps:', error);
    
    // Log the error to the database
    await supabase
      .from('sitemap_logs')
      .insert({
        status: 'error',
        message: `Error generating sitemap: ${error.message}`,
        source: 'regenerate-sitemap-function',
        details: { 
          error: error.message,
          stack: error.stack
        }
      });
    
    throw error;
  }
}

// Create XML for a sitemap index
function createSitemapIndex(sitemapFiles) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  for (const file of sitemapFiles) {
    xml += '  <sitemap>\n';
    xml += `    <loc>https://soundraiser.io/${file}</loc>\n`;
    xml += `    <lastmod>${format(new Date(), "yyyy-MM-dd")}</lastmod>\n`;
    xml += '  </sitemap>\n';
  }
  
  xml += '</sitemapindex>';
  return xml;
}

// Create XML for a regular sitemap
function createSitemap(urls) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  for (const url of urls) {
    xml += '  <url>\n';
    xml += `    <loc>https://soundraiser.io${url.url}</loc>\n`;
    
    if (url.updated_at) {
      const date = new Date(url.updated_at);
      xml += `    <lastmod>${format(date, "yyyy-MM-dd")}</lastmod>\n`;
    }
    
    if (url.changefreq) {
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    }
    
    if (url.priority) {
      xml += `    <priority>${url.priority}</priority>\n`;
    }
    
    xml += '  </url>\n';
  }
  
  xml += '</urlset>';
  return xml;
}
