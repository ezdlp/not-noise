
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SitemapUrl {
  url: string
  updated_at: string
  changefreq: string
  priority: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with auth bypass for public access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing environment variables')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`
        }
      }
    })

    console.log('Fetching sitemap URLs...')
    
    // Fetch sitemap URLs from our database function
    const { data: urls, error } = await supabaseClient
      .rpc('get_sitemap_urls')

    if (error) {
      console.error('Error fetching sitemap URLs:', error)
      throw error
    }

    if (!urls || urls.length === 0) {
      console.warn('No URLs returned from get_sitemap_urls')
      throw new Error('No URLs found')
    }

    console.log(`Generated sitemap with ${urls.length} URLs`)

    // Generate XML sitemap
    const xml = generateSitemapXml(urls as SitemapUrl[])

    // Return the XML with appropriate headers
    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=1800', // Cache for 30 minutes
      },
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new Response(JSON.stringify({ 
      error: 'Error generating sitemap',
      details: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

function generateSitemapXml(urls: SitemapUrl[]): string {
  const urlElements = urls.map(url => `
    <url>
      <loc>https://soundraiser.io${url.url}</loc>
      <lastmod>${new Date(url.updated_at).toISOString()}</lastmod>
      <changefreq>${url.changefreq}</changefreq>
      <priority>${url.priority}</priority>
    </url>
  `).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urlElements}
</urlset>`
}
