import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { format } from 'https://deno.land/std@0.202.0/datetime/format.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Maximum URLs per sitemap file (Google's limit is 50,000, but we use a lower number for better performance)
const URLS_PER_FILE = 10000;

// Base URL for the site
const SITE_URL = 'https://soundraiser.io';

// Create XML for a sitemap index
function createSitemapIndex(sitemapFiles: string[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  for (const file of sitemapFiles) {
    xml += '  <sitemap>\n';
    xml += `    <loc>${SITE_URL}/${file}</loc>\n`;
    xml += `    <lastmod>${format(new Date(), "yyyy-MM-dd")}</lastmod>\n`;
    xml += '  </sitemap>\n';
  }
  
  xml += '</sitemapindex>';
  return xml;
}

// Create XML for a regular sitemap
function createSitemap(urls: Array<{ url: string; lastmod?: string; changefreq?: string; priority?: number; }>): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  for (const url of urls) {
    xml += '  <url>\n';
    xml += `    <loc>${SITE_URL}${url.url}</loc>\n`;
    
    if (url.lastmod) {
      const date = new Date(url.lastmod);
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

// Save sitemap to cache
async function saveSitemapToCache(supabase, key: string, content: string) {
  const { error } = await supabase
    .from('sitemap_cache')
    .upsert({
      key,
      content,
      etag: crypto.randomUUID(),
      updated_at: new Date().toISOString()
    });

  if (error) {
    throw new Error(`Error saving sitemap ${key}: ${error.message}`);
  }
}

// Generate all sitemaps
async function generateSitemaps(supabase): Promise<string[]> {
  console.log("Starting sitemap generation");
  
  try {
    // 1. Generate static pages sitemap
    const staticUrls = [
      { url: '/', changefreq: 'weekly', priority: 1.0 },
      { url: '/pricing', changefreq: 'weekly', priority: 0.9 },
      { url: '/spotify-playlist-promotion', changefreq: 'weekly', priority: 0.9 },
      { url: '/spotify-royalty-calculator', changefreq: 'monthly', priority: 0.8 },
      { url: '/blog', changefreq: 'daily', priority: 0.9 },
      { url: '/create', changefreq: 'weekly', priority: 0.8 },
    ];

    const staticSitemap = createSitemap(staticUrls);
    await saveSitemapToCache(supabase, 'sitemap-static.xml', staticSitemap);
    console.log('Generated static sitemap');

    // 2. Generate blog posts sitemap
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .eq('visibility', 'public')
      .order('published_at', { ascending: false });

    if (blogError) {
      throw new Error(`Error fetching blog posts: ${blogError.message}`);
    }

    const blogUrls = blogPosts?.map(post => ({
      url: `/blog/${post.slug}`,
      lastmod: post.updated_at || post.published_at,
      changefreq: 'weekly',
      priority: 0.8
    })) || [];

    const blogSitemap = createSitemap(blogUrls);
    await saveSitemapToCache(supabase, 'sitemap-blog.xml', blogSitemap);
    console.log('Generated blog sitemap');

    // 3. Generate smart links sitemaps in batches
    let offset = 0;
    let fileIndex = 1;
    let allSitemapFiles = ['sitemap-static.xml', 'sitemap-blog.xml'];

    while (true) {
      const { data: links, error: linksError } = await supabase
        .from('smart_links')
        .select('slug, updated_at')
        .not('slug', 'is', null)
        .range(offset, offset + URLS_PER_FILE - 1)
        .order('updated_at', { ascending: false });

      if (linksError) {
        throw new Error(`Error fetching smart links batch: ${linksError.message}`);
      }

      if (!links || links.length === 0) {
        break;
      }

      const linkUrls = links.map(link => ({
        url: `/link/${link.slug}`,
        lastmod: link.updated_at,
        changefreq: 'weekly',
        priority: 0.7
      }));

      const filename = `sitemap-links-${fileIndex}.xml`;
      const linksSitemap = createSitemap(linkUrls);
      await saveSitemapToCache(supabase, filename, linksSitemap);
      allSitemapFiles.push(filename);

      console.log(`Generated smart links sitemap ${fileIndex}`);

      if (links.length < URLS_PER_FILE) {
        break;
      }

      offset += URLS_PER_FILE;
      fileIndex++;
    }

    // 4. Generate sitemap index
    const sitemapIndex = createSitemapIndex(allSitemapFiles);
    await saveSitemapToCache(supabase, 'sitemap-index.xml', sitemapIndex);
    console.log('Generated sitemap index');

    // Log success
    await supabase.from('sitemap_logs').insert({
      status: 'success',
      message: 'Completed sitemap regeneration',
      source: 'simplified-sitemap',
      details: { files: allSitemapFiles }
    });

    return allSitemapFiles;
  } catch (error) {
    console.error('Error generating sitemaps:', error);
    
    // Log the error
    await supabase.from('sitemap_logs').insert({
      status: 'error',
      message: `Error generating sitemap: ${error.message}`,
      source: 'simplified-sitemap',
      details: { 
        error: error.message,
        stack: error.stack
      }
    });
    
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Extract the filename from the URL
    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean);
    
    // If a specific file is requested (e.g., /simplified-sitemap/sitemap-posts.xml)
    // use that, otherwise default to sitemap-index.xml
    let requestedFile = 'sitemap-index.xml';
    if (path.length > 1) {
      requestedFile = path[path.length - 1];
    }
    
    // If the file doesn't have .xml extension, add it
    if (!requestedFile.endsWith('.xml')) {
      requestedFile = `${requestedFile}.xml`;
    }
    
    console.log(`Requested sitemap file: ${requestedFile}`);
    
    // Check if we need to regenerate the sitemap
    const regenerate = url.searchParams.get('regenerate') === 'true';
    
    if (regenerate) {
      console.log('Regenerating all sitemaps...');
      const sitemapFiles = await generateSitemaps(supabase);
      console.log('Sitemap regeneration complete');
      
      // After regeneration, always serve the requested file or default to sitemap index
      // This ensures something is returned even after regeneration
    }
    
    // Fetch the requested sitemap from cache
    const { data: initialData, error } = await supabase
      .from('sitemap_cache')
      .select('content, etag, updated_at')
      .eq('key', requestedFile)
      .maybeSingle();
    
    if (error) {
      throw new Error(`Error fetching sitemap: ${error.message}`);
    }
    
    // If the sitemap doesn't exist or is older than 24 hours, regenerate it
    const now = new Date();
    const needsRegeneration = !initialData || 
      (initialData.updated_at && (now.getTime() - new Date(initialData.updated_at).getTime() > 24 * 60 * 60 * 1000));
    
    // Variable to hold our final data
    let sitemapData = initialData;
    
    if (needsRegeneration && !regenerate) {
      console.log('Sitemap needs regeneration, generating now...');
      await generateSitemaps(supabase);
      
      // Fetch the newly generated sitemap
      const { data: newData, error: newError } = await supabase
        .from('sitemap_cache')
        .select('content, etag')
        .eq('key', requestedFile)
        .maybeSingle();
      
      if (newError) {
        throw new Error(`Error fetching regenerated sitemap: ${newError.message}`);
      }
      
      // Use the newly generated data if available
      if (newData) {
        sitemapData = newData;
      }
    }
    
    // If the sitemap doesn't exist even after regeneration, return a 404
    if (!sitemapData) {
      console.error(`Sitemap ${requestedFile} not found`);
      
      // If the requested file is not the index, try to serve the index instead
      if (requestedFile !== 'sitemap-index.xml') {
        console.log('Attempting to serve sitemap index instead');
        const { data: indexData } = await supabase
          .from('sitemap_cache')
          .select('content, etag')
          .eq('key', 'sitemap-index.xml')
          .maybeSingle();
          
        if (indexData) {
          return new Response(indexData.content, {
            headers: {
              'Content-Type': 'application/xml',
              'Cache-Control': 'public, max-age=3600',
              'ETag': indexData.etag || '',
            },
          });
        }
      }
      
      return new Response(`Sitemap ${requestedFile} not found`, { status: 404 });
    }
    
    // Return the sitemap with appropriate headers
    return new Response(sitemapData.content, {
      headers: {
        'Content-Type': 'application/xml; charset=UTF-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'ETag': sitemapData.etag || '""'
      }
    });
    
  } catch (error) {
    console.error('Error serving sitemap:', error);
    
    // Try to log the error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
      );
      
      await supabase.from('sitemap_logs').insert({
        status: 'error',
        message: 'Error serving sitemap',
        source: 'simplified-sitemap',
        details: {
          error: error.message,
          stack: error.stack
        }
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error serving sitemap',
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