
export const config = {
  runtime: 'edge',
  regions: ['iad1'], // Choose closest region to your main user base
};

const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93dHVmaGRzdXV5cmdteHl0Y2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2Njc2MzYsImV4cCI6MjA1MTI0MzYzNn0.Yl6IzV36GK1yNZ42AlSGJEpm_QAXXJ7fqQsQB-omoDc";

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'off',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

export default async function handler(request: Request) {
  try {
    const url = new URL(request.url)
    const segment = url.searchParams.get('segment')
    const type = url.searchParams.get('type')
    
    // Check if client accepts compression
    const acceptEncoding = request.headers.get('Accept-Encoding') || ''
    const supportsCompression = acceptEncoding.includes('br') || acceptEncoding.includes('gzip')
    
    // Handle XSL stylesheet requests
    if (url.pathname === '/sitemap.xsl') {
      const response = await fetch('https://soundraiser.io/sitemap.xsl')
      const xsl = await response.text()
      return new Response(xsl, {
        headers: {
          'Content-Type': 'text/xsl',
          'Cache-Control': 'public, max-age=86400',
          ...SECURITY_HEADERS,
        },
      })
    }

    // Determine sitemap type from URL
    let sitemapType = type || 'all'
    if (url.pathname === '/sitemap-blog.xml') {
      sitemapType = 'blog'
    } else if (url.pathname === '/sitemap-main.xml') {
      sitemapType = 'main'
    }

    const apiUrl = `https://owtufhdsuuyrgmxytclj.functions.supabase.co/sitemap${segment ? `?segment=${segment}` : ''}${type ? `&type=${type}` : ''}`

    // Forward client's ETag if present
    const clientETag = request.headers.get('If-None-Match')
    const headers: HeadersInit = {
      'Authorization': `Bearer ${ANON_KEY}`,
      'apikey': ANON_KEY,
    }
    if (clientETag) {
      headers['If-None-Match'] = clientETag
    }
    if (supportsCompression) {
      headers['Accept-Encoding'] = acceptEncoding
    }

    const response = await fetch(apiUrl, { headers })

    // Handle 304 Not Modified
    if (response.status === 304) {
      return new Response(null, {
        status: 304,
        headers: {
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
          'ETag': response.headers.get('ETag') || '',
          ...SECURITY_HEADERS,
        },
      })
    }

    if (!response.ok) {
      console.error('Supabase function error:', await response.text())
      throw new Error('Failed to fetch sitemap')
    }

    const contentEncoding = response.headers.get('Content-Encoding')
    const etag = response.headers.get('ETag')

    return new Response(await response.arrayBuffer(), {
      headers: {
        'Content-Type': 'application/xml; charset=UTF-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        ...(contentEncoding && { 'Content-Encoding': contentEncoding }),
        ...(etag && { 'ETag': etag }),
        'Vary': 'Accept-Encoding',
        'X-Robots-Tag': 'noindex',
        ...SECURITY_HEADERS,
      },
    })
  } catch (error) {
    console.error('Error in sitemap edge function:', error)
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://soundraiser.io</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>`,
      {
        headers: {
          'Content-Type': 'application/xml; charset=UTF-8',
          'Cache-Control': 'no-store',
          ...SECURITY_HEADERS,
        },
        status: 500
      }
    )
  }
}
