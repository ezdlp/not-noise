
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { format } from 'https://deno.land/std@0.202.0/datetime/format.ts'

// Batch size for processing URLs
const BATCH_SIZE = 1000;

// Create XML for a sitemap index
function createSitemapIndex(sitemapFiles: string[]): string {
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
function createSitemap(urls: any[]): string {
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

// Generate sitemaps and store them in cache
export async function generateSitemaps(): Promise<string[]> {
  console.log("Starting sitemap generation");
  
  // Create a Supabase client with service role
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: { persistSession: false }
    }
  );
  
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
    const sitemapFiles: string[] = [];
    
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
      
      // Determine sitemap type based on URLs in this batch
      let sitemapType = 'general';
      if (i === 0) {
        // Check first URL to see if it's a specific type
        const firstUrl = urls[0].url;
        if (firstUrl.startsWith('/blog/')) {
          sitemapType = 'blog';
        } else if (firstUrl.startsWith('/link/')) {
          sitemapType = 'links';
        } else {
          sitemapType = 'static';
        }
      } else {
        sitemapType = `part${i}`;
      }
      
      // Generate sitemap filename
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
        source: 'sitemap-generator',
        details: { 
          error: error.message,
          stack: error.stack
        }
      });
    
    throw error;
  }
}

// If this module is run directly, generate sitemaps
if (import.meta.main) {
  try {
    const files = await generateSitemaps();
    console.log(`Generated ${files.length} sitemap files`);
  } catch (error) {
    console.error('Fatal error in sitemap generation:', error);
    Deno.exit(1);
  }
}
