
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

serve(async (req) => {
  try {
    // Check if this is a POST request
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Get API key from request headers
    const apiKey = req.headers.get('x-api-key')
    
    // Check if the API key is valid (you should use a more secure method in production)
    if (!apiKey || apiKey !== Deno.env.get('SITEMAP_API_KEY')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Initialize sitemap entries array
    const entries: SitemapEntry[] = []
    
    // Add static pages
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'weekly' },
      { url: '/pricing', priority: '0.9', changefreq: 'weekly' },
      { url: '/spotify-playlist-promotion', priority: '0.9', changefreq: 'weekly' },
      { url: '/spotify-royalty-calculator', priority: '0.8', changefreq: 'monthly' },
      { url: '/blog', priority: '0.9', changefreq: 'daily' },
      { url: '/contact', priority: '0.7', changefreq: 'monthly' },
      { url: '/help', priority: '0.7', changefreq: 'monthly' },
    ]
    
    staticPages.forEach(page => {
      entries.push({
        loc: `https://soundraiser.io${page.url}`,
        lastmod: new Date().toISOString(),
        changefreq: page.changefreq,
        priority: page.priority
      })
    })
    
    // Add smart links
    const { data: smartLinks, error: smartLinksError } = await supabase
      .from('smart_links')
      .select('slug, updated_at')
      .not('slug', 'is', null)
    
    if (smartLinksError) {
      console.error('Error fetching smart links:', smartLinksError)
    } else if (smartLinks) {
      smartLinks.forEach(link => {
        entries.push({
          loc: `https://soundraiser.io/link/${link.slug}`,
          lastmod: new Date(link.updated_at || Date.now()).toISOString(),
          changefreq: 'weekly',
          priority: '0.7'
        })
      })
    }
    
    // Add blog posts
    const { data: blogPosts, error: blogPostsError } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .eq('visibility', 'public')
    
    if (blogPostsError) {
      console.error('Error fetching blog posts:', blogPostsError)
    } else if (blogPosts) {
      blogPosts.forEach(post => {
        const updateDate = post.updated_at || post.published_at || new Date().toISOString()
        entries.push({
          loc: `https://soundraiser.io/${post.slug}`,
          lastmod: new Date(updateDate).toISOString(),
          changefreq: 'weekly',
          priority: '0.8'
        })
      })
    }
    
    // Generate the sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`
    
    entries.forEach(entry => {
      sitemap += `
  <url>
    <loc>${entry.loc}</loc>
    ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}
    ${entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ''}
    ${entry.priority ? `<priority>${entry.priority}</priority>` : ''}
  </url>`
    })
    
    sitemap += `
</urlset>`
    
    // Store the sitemap in the database for later retrieval
    const { error: storageError } = await supabase
      .from('sitemap_cache')
      .upsert(
        { 
          key: 'sitemap.xml', 
          content: sitemap,
          etag: Date.now().toString(),
          updated_at: new Date().toISOString()
        },
        { onConflict: 'key' }
      )
    
    if (storageError) {
      console.error('Error storing sitemap:', storageError)
      return new Response(
        JSON.stringify({ error: 'Failed to store sitemap' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Sitemap regenerated successfully',
        url_count: entries.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error regenerating sitemap:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
