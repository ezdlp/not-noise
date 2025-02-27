
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

interface SitemapLog {
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: Record<string, any>;
  source: string;
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders
    })
  }
  
  try {
    let source = 'unknown';
    let requestBody = {};
    
    // Try to parse request body
    try {
      requestBody = await req.json();
      source = requestBody.source || 'api';
    } catch (e) {
      // If parsing fails, default to API source
      source = 'api';
    }
    
    // Log generation attempt
    await logSitemapEvent({
      status: 'success',
      message: 'Sitemap regeneration started',
      source,
      details: { trigger: source }
    });
    
    // Check if this is a POST request
    if (req.method !== 'POST') {
      await logSitemapEvent({
        status: 'error',
        message: 'Method not allowed',
        source,
        details: { method: req.method }
      });
      
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }
    
    // Get API key from request headers
    const apiKey = req.headers.get('x-api-key')
    
    // Check if the API key is valid
    const sitemapApiKey = Deno.env.get('SITEMAP_API_KEY') || 
                         (await getConfigValue('sitemap_webhook_key'))
    
    if (!apiKey || apiKey !== sitemapApiKey) {
      await logSitemapEvent({
        status: 'error',
        message: 'Unauthorized sitemap regeneration attempt',
        source,
        details: { provided_key: apiKey ? 'redacted' : 'none' }
      });
      
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
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
    try {
      const { data: smartLinks, error: smartLinksError } = await supabase
        .from('smart_links')
        .select('slug, updated_at')
        .not('slug', 'is', null)
      
      if (smartLinksError) {
        await logSitemapEvent({
          status: 'warning',
          message: 'Error fetching smart links',
          source,
          details: { error: smartLinksError.message }
        });
      } else if (smartLinks) {
        await logSitemapEvent({
          status: 'success',
          message: 'Smart links fetched successfully',
          source,
          details: { count: smartLinks.length }
        });
        
        smartLinks.forEach(link => {
          entries.push({
            loc: `https://soundraiser.io/link/${link.slug}`,
            lastmod: new Date(link.updated_at || Date.now()).toISOString(),
            changefreq: 'weekly',
            priority: '0.7'
          })
        })
      }
    } catch (error) {
      await logSitemapEvent({
        status: 'error',
        message: 'Exception while processing smart links',
        source,
        details: { error: error.message }
      });
    }
    
    // Add blog posts and pagination
    try {
      const { data: blogPosts, error: blogPostsError } = await supabase
        .from('blog_posts')
        .select('slug, updated_at, published_at')
        .eq('status', 'published')
        .eq('visibility', 'public')
      
      if (blogPostsError) {
        await logSitemapEvent({
          status: 'warning',
          message: 'Error fetching blog posts',
          source,
          details: { error: blogPostsError.message }
        });
      } else if (blogPosts && blogPosts.length > 0) {
        await logSitemapEvent({
          status: 'success',
          message: 'Blog posts fetched successfully',
          source,
          details: { count: blogPosts.length }
        });
        
        // Add individual blog posts
        blogPosts.forEach(post => {
          const updateDate = post.updated_at || post.published_at || new Date().toISOString()
          entries.push({
            loc: `https://soundraiser.io/blog/${post.slug}`,
            lastmod: new Date(updateDate).toISOString(),
            changefreq: 'weekly',
            priority: '0.8'
          })
        })
        
        // Add blog pagination
        const postsPerPage = 12
        const totalPages = Math.ceil(blogPosts.length / postsPerPage)
        
        if (totalPages > 1) {
          // First page is already included in static pages
          // Add pages 2 to n
          for (let i = 2; i <= totalPages; i++) {
            entries.push({
              loc: `https://soundraiser.io/blog/page/${i}`,
              lastmod: new Date().toISOString(),
              changefreq: 'daily',
              priority: '0.8'
            })
          }
        }
      }
    } catch (error) {
      await logSitemapEvent({
        status: 'error',
        message: 'Exception while processing blog posts',
        source,
        details: { error: error.message }
      });
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
    try {
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
        await logSitemapEvent({
          status: 'error',
          message: 'Failed to store sitemap',
          source,
          details: { error: storageError.message }
        });
        
        return new Response(
          JSON.stringify({ error: 'Failed to store sitemap' }),
          { 
            status: 500, 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        )
      }
      
      // Log successful sitemap generation
      await logSitemapEvent({
        status: 'success',
        message: 'Sitemap regenerated and stored successfully',
        source,
        details: { url_count: entries.length, size_bytes: sitemap.length }
      });
      
      // Ping search engines
      try {
        // Call the ping-search-engines edge function
        const pingUrl = 'https://owtufhdsuuyrgmxytclj.supabase.co/functions/v1/ping-search-engines';
        const pingResponse = await fetch(pingUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
          },
          body: JSON.stringify({
            source: 'sitemap-regeneration',
            timestamp: new Date().toISOString()
          })
        });
        
        const pingData = await pingResponse.json();
        
        await logSitemapEvent({
          status: pingData.success ? 'success' : 'warning',
          message: `Search engine ping ${pingData.success ? 'successful' : 'failed'}`,
          source,
          details: pingData
        });
      } catch (pingError) {
        await logSitemapEvent({
          status: 'warning',
          message: 'Search engine ping failed',
          source,
          details: { error: pingError.message }
        });
        
        // Continue execution - ping failure shouldn't affect overall success
        console.error('Error pinging search engines:', pingError);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Sitemap regenerated successfully',
          url_count: entries.length
        }),
        { 
          status: 200, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    } catch (error) {
      await logSitemapEvent({
        status: 'error',
        message: 'Exception while storing sitemap',
        source,
        details: { error: error.message }
      });
      
      return new Response(
        JSON.stringify({ error: 'Internal server error while storing sitemap' }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }
  } catch (error) {
    // Log the error
    try {
      await logSitemapEvent({
        status: 'error',
        message: 'Unhandled exception during sitemap regeneration',
        source: 'unknown',
        details: { error: error.message, stack: error.stack }
      });
    } catch (logError) {
      console.error('Failed to log sitemap error:', logError);
      console.error('Original error:', error);
    }
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )
  }
})

// Helper function to get config values from the database
async function getConfigValue(key: string): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data, error } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', key)
      .single()
    
    if (error || !data) {
      console.error(`Error fetching config value for ${key}:`, error)
      return ''
    }
    
    return data.value
  } catch (error) {
    console.error(`Error in getConfigValue for ${key}:`, error)
    return ''
  }
}

// Helper function to log sitemap events
async function logSitemapEvent(event: SitemapLog): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { error } = await supabase
      .from('sitemap_logs')
      .insert({
        status: event.status,
        message: event.message,
        details: event.details || {},
        source: event.source,
      })
    
    if (error) {
      console.error('Failed to log sitemap event:', error)
    }
  } catch (error) {
    console.error('Exception while logging sitemap event:', error)
  }
}
