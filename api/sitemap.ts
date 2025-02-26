
export const config = {
  runtime: 'edge',
};

const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93dHVmaGRzdXV5cmdteHl0Y2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2Njc2MzYsImV4cCI6MjA1MTI0MzYzNn0.Yl6IzV36GK1yNZ42AlSGJEpm_QAXXJ7fqQsQB-omoDc";

export default async function handler(request: Request) {
  try {
    const url = new URL(request.url)
    const segment = url.searchParams.get('segment')
    const type = url.searchParams.get('type')
    
    // Handle XSL stylesheet requests
    if (url.pathname === '/sitemap.xsl') {
      const response = await fetch('https://soundraiser.io/sitemap.xsl');
      return new Response(await response.text(), {
        headers: {
          'Content-Type': 'text/xsl',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // Determine sitemap type from URL
    let sitemapType = type || 'all';
    if (url.pathname === '/sitemap-blog.xml') {
      sitemapType = 'blog';
    } else if (url.pathname === '/sitemap-main.xml') {
      sitemapType = 'main';
    }

    const apiUrl = `https://owtufhdsuuyrgmxytclj.functions.supabase.co/sitemap${segment ? `?segment=${segment}` : ''}${type ? `&type=${type}` : ''}`

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      }
    });

    if (!response.ok) {
      console.error('Supabase function error:', await response.text());
      throw new Error('Failed to fetch sitemap');
    }

    const xml = await response.text();

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=UTF-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'X-Robots-Tag': 'noindex',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
      },
    });
  } catch (error) {
    console.error('Error in sitemap edge function:', error);
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
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
        },
        status: 500
      }
    );
  }
}
