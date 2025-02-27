
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { format } from 'https://deno.land/std@0.202.0/datetime/format.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const URLS_PER_FILE = 1000; // Maximum URLs per sitemap file

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting sitemap regeneration process');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Log the start of the process
    await supabase.from('sitemap_logs').insert({
      status: 'info',
      message: 'Starting sitemap regeneration',
      source: 'regenerate-sitemap'
    });

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
      source: 'regenerate-sitemap',
      details: { files: allSitemapFiles }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sitemaps generated successfully',
        files: allSitemapFiles
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error generating sitemaps:', error);

    // Try to log the error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
      );

      await supabase.from('sitemap_logs').insert({
        status: 'error',
        message: 'Error generating sitemaps',
        source: 'regenerate-sitemap',
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
        message: 'Error generating sitemaps',
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

function createSitemap(urls: Array<{ url: string; lastmod?: string; changefreq?: string; priority?: number; }>) {
  const xml = ['<?xml version="1.0" encoding="UTF-8"?>'];
  xml.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

  for (const { url, lastmod, changefreq, priority } of urls) {
    xml.push('  <url>');
    xml.push(`    <loc>https://soundraiser.io${url}</loc>`);
    if (lastmod) {
      xml.push(`    <lastmod>${format(new Date(lastmod), "yyyy-MM-dd")}</lastmod>`);
    }
    if (changefreq) {
      xml.push(`    <changefreq>${changefreq}</changefreq>`);
    }
    if (priority) {
      xml.push(`    <priority>${priority}</priority>`);
    }
    xml.push('  </url>');
  }

  xml.push('</urlset>');
  return xml.join('\n');
}

function createSitemapIndex(files: string[]) {
  const xml = ['<?xml version="1.0" encoding="UTF-8"?>'];
  xml.push('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

  for (const file of files) {
    xml.push('  <sitemap>');
    xml.push(`    <loc>https://soundraiser.io/${file}</loc>`);
    xml.push(`    <lastmod>${format(new Date(), "yyyy-MM-dd")}</lastmod>`);
    xml.push('  </sitemap>');
  }

  xml.push('</sitemapindex>');
  return xml.join('\n');
}
