
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

serve(async (req) => {
  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Retrieve the stored sitemap
    const { data, error } = await supabase
      .from('sitemap_cache')
      .select('content, etag, updated_at')
      .eq('key', 'sitemap.xml')
      .single()
    
    if (error || !data) {
      console.error('Error retrieving sitemap:', error)
      
      // If we can't get the stored sitemap, generate a minimal fallback
      const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://soundraiser.io/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`
      
      return new Response(fallbackSitemap, { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/xml; charset=UTF-8',
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
        } 
      })
    }
    
    // Return the sitemap with appropriate headers
    return new Response(data.content, { 
      status: 200, 
      headers: { 
        'Content-Type': 'application/xml; charset=UTF-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'ETag': data.etag || '',
        'Last-Modified': data.updated_at || new Date().toISOString()
      } 
    })
  } catch (error) {
    console.error('Error serving sitemap:', error)
    
    // Provide a minimal fallback sitemap in case of error
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://soundraiser.io/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`
    
    return new Response(fallbackSitemap, { 
      status: 200, 
      headers: { 
        'Content-Type': 'application/xml; charset=UTF-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
      } 
    })
  }
})
