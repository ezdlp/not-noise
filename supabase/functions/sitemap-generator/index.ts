
import { corsHeaders, xmlResponse, xmlErrorResponse, createAdminClient, logSitemapEvent, generateETag, SITE_URL, BATCH_SIZE } from '../_shared/sitemap-utils.ts';

// Generate sitemap index XML
function generateSitemapIndex(sitemaps: Array<{ filename: string; lastmod: string }>) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  for (const sitemap of sitemaps) {
    xml += '  <sitemap>\n';
    xml += `    <loc>${SITE_URL}/${sitemap.filename}</loc>\n`;
    xml += `    <lastmod>${sitemap.lastmod}</lastmod>\n`;
    xml += '  </sitemap>\n';
  }
  
  xml += '</sitemapindex>';
  return xml;
}

// Generate sitemap XML for a group of URLs
function generateSitemap(urls: Array<{ loc: string; lastmod?: string; changefreq: string; priority: number }>) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  for (const url of urls) {
    xml += '  <url>\n';
    xml += `    <loc>${url.loc}</loc>\n`;
    
    if (url.lastmod) {
      xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    }
    
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority.toFixed(1)}</priority>\n`;
    xml += '  </url>\n';
  }
  
  xml += '</urlset>';
  return xml;
}

// Main handler function
export const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return xmlErrorResponse('Only POST method is allowed', 405);
  }
  
  try {
    // Parse request body
    const { type, filename, trigger } = await req.json();
    
    // Initialize Supabase client with admin role
    const supabase = createAdminClient();
    
    // Log start of operation
    await logSitemapEvent(
      supabase, 
      'success', 
      `Started sitemap generation for ${type || 'all'}`, 
      'sitemap-generator',
      { type, filename, trigger }
    );
    
    // Collect all sitemaps that will be included in the index
    const sitemapFiles: Array<{ filename: string; lastmod: string }> = [];
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Generate static pages sitemap
    const staticPages = [
      { url: '/', priority: 1.0, changefreq: 'weekly' },
      { url: '/pricing', priority: 0.9, changefreq: 'weekly' },
      { url: '/spotify-playlist-promotion', priority: 0.9, changefreq: 'weekly' },
      { url: '/spotify-royalty-calculator', priority: 0.8, changefreq: 'monthly' },
      { url: '/blog', priority: 0.9, changefreq: 'daily' },
      { url: '/create', priority: 0.8, changefreq: 'weekly' },
    ];
    
    if (type === 'index' || type === 'all' || (type === 'file' && filename === 'sitemap-static.xml')) {
      console.log('Generating static pages sitemap');
      
      const staticUrls = staticPages.map(page => ({
        loc: `${SITE_URL}${page.url}`,
        lastmod: today,
        changefreq: page.changefreq,
        priority: page.priority
      }));
      
      const staticSitemap = generateSitemap(staticUrls);
      const staticEtag = await generateETag(staticSitemap);
      
      await supabase
        .from('sitemap_cache')
        .upsert(
          { 
            key: 'sitemap-static.xml',
            content: staticSitemap,
            etag: staticEtag,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'key' }
        );
      
      sitemapFiles.push({ 
        filename: 'sitemap-static.xml', 
        lastmod: today 
      });
      
      console.log('Static pages sitemap generated successfully');
    }
    
    // 2. Generate blog posts sitemap
    if (type === 'index' || type === 'all' || (type === 'file' && filename === 'sitemap-blog.xml')) {
      console.log('Generating blog posts sitemap');
      
      const { data: blogPosts, error: blogError } = await supabase
        .from('blog_posts')
        .select('slug, published_at, updated_at')
        .eq('status', 'published');
      
      if (blogError) {
        throw new Error(`Failed to fetch blog posts: ${blogError.message}`);
      }
      
      if (blogPosts && blogPosts.length > 0) {
        const blogUrls = blogPosts.map(post => ({
          loc: `${SITE_URL}/blog/${post.slug}`,
          lastmod: new Date(post.updated_at || post.published_at).toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: 0.8
        }));
        
        const blogSitemap = generateSitemap(blogUrls);
        const blogEtag = await generateETag(blogSitemap);
        
        await supabase
          .from('sitemap_cache')
          .upsert(
            { 
              key: 'sitemap-blog.xml',
              content: blogSitemap,
              etag: blogEtag,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'key' }
          );
        
        sitemapFiles.push({ 
          filename: 'sitemap-blog.xml', 
          lastmod: today 
        });
        
        console.log(`Blog sitemap generated with ${blogPosts.length} posts`);
      }
    }
    
    // 3. Generate smart links sitemaps (paginated)
    if (type === 'index' || type === 'all' || (type === 'file' && filename?.startsWith('sitemap-links-'))) {
      console.log('Generating smart links sitemaps');
      
      // Count total smart links with slugs
      const { count: totalLinks, error: countError } = await supabase
        .from('smart_links')
        .select('*', { count: 'exact', head: true })
        .not('slug', 'is', null);
      
      if (countError) {
        throw new Error(`Failed to count smart links: ${countError.message}`);
      }
      
      const totalPages = Math.ceil((totalLinks || 0) / BATCH_SIZE);
      console.log(`Found ${totalLinks} smart links, will create ${totalPages} sitemap files`);
      
      // If generating a specific links sitemap file
      if (type === 'file' && filename?.startsWith('sitemap-links-')) {
        const pageMatch = filename.match(/sitemap-links-(\d+)\.xml/);
        if (pageMatch && pageMatch[1]) {
          const page = parseInt(pageMatch[1], 10);
          
          if (page > 0 && page <= totalPages) {
            await generateSmartLinkSitemap(supabase, page, BATCH_SIZE, sitemapFiles);
          } else {
            console.error(`Requested page ${page} is out of range (1-${totalPages})`);
          }
        }
      } 
      // If generating all links sitemaps
      else {
        for (let page = 1; page <= totalPages; page++) {
          await generateSmartLinkSitemap(supabase, page, BATCH_SIZE, sitemapFiles);
        }
      }
    }
    
    // 4. Finally, generate the sitemap index if requested
    if (type === 'index' || type === 'all') {
      console.log('Generating sitemap index');
      
      const sitemapIndex = generateSitemapIndex(sitemapFiles);
      const indexEtag = await generateETag(sitemapIndex);
      
      await supabase
        .from('sitemap_cache')
        .upsert(
          { 
            key: 'sitemap-index.xml',
            content: sitemapIndex,
            etag: indexEtag,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'key' }
        );
      
      console.log(`Sitemap index generated with ${sitemapFiles.length} sitemaps`);
    }
    
    // Log successful completion
    await logSitemapEvent(
      supabase, 
      'success', 
      `Completed sitemap generation for ${type || 'all'}`, 
      'sitemap-generator',
      { 
        type, 
        filename, 
        generated_files: sitemapFiles.map(f => f.filename),
        file_count: sitemapFiles.length
      }
    );
    
    // Ping search engines if this was a full generation
    if (type === 'all') {
      try {
        await supabase.functions.invoke('ping-search-engines', {
          body: { sitemapUrl: `${SITE_URL}/sitemap.xml` }
        });
      } catch (pingError) {
        console.error(`Failed to ping search engines: ${pingError.message}`);
      }
    }
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully generated sitemaps for ${type || 'all'}`,
        files: sitemapFiles.map(f => f.filename)
      }),
      { 
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
    
  } catch (error) {
    console.error(`Error generating sitemap: ${error.message}`);
    
    // Try to log the error
    try {
      const supabase = createAdminClient();
      await logSitemapEvent(
        supabase, 
        'error', 
        `Error generating sitemap: ${error.message}`, 
        'sitemap-generator',
        { error: error.stack || 'No stack trace available' }
      );
    } catch (logError) {
      console.error(`Failed to log error: ${logError.message}`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Error generating sitemap: ${error.message}`
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  }
};

// Helper function to generate a single smart links sitemap page
async function generateSmartLinkSitemap(supabase: any, page: number, batchSize: number, sitemapFiles: Array<{ filename: string; lastmod: string }>) {
  const offset = (page - 1) * batchSize;
  
  console.log(`Generating smart links sitemap page ${page} (offset: ${offset}, limit: ${batchSize})`);
  
  const { data: links, error: linksError } = await supabase
    .from('smart_links')
    .select('slug, updated_at')
    .not('slug', 'is', null)
    .order('updated_at', { ascending: false })
    .range(offset, offset + batchSize - 1);
  
  if (linksError) {
    throw new Error(`Failed to fetch smart links for page ${page}: ${linksError.message}`);
  }
  
  if (links && links.length > 0) {
    const linkUrls = links.map(link => ({
      loc: `${SITE_URL}/link/${link.slug}`,
      lastmod: new Date(link.updated_at).toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: 0.7
    }));
    
    const linkSitemap = generateSitemap(linkUrls);
    const linkEtag = await generateETag(linkSitemap);
    const filename = `sitemap-links-${page}.xml`;
    
    await supabase
      .from('sitemap_cache')
      .upsert(
        { 
          key: filename,
          content: linkSitemap,
          etag: linkEtag,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'key' }
      );
    
    sitemapFiles.push({ 
      filename, 
      lastmod: new Date().toISOString().split('T')[0] 
    });
    
    console.log(`Generated smart links sitemap page ${page} with ${links.length} links`);
  } else {
    console.log(`No smart links found for page ${page}`);
  }
}
