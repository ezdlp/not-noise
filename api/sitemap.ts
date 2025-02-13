
export const config = {
  runtime: 'edge',
};

// Use the anon key directly since it's a public key anyway
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93dHVmaGRzdXV5cmdteHl0Y2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2Njc2MzYsImV4cCI6MjA1MTI0MzYzNn0.Yl6IzV36GK1yNZ42AlSGJEpm_QAXXJ7fqQsQB-omoDc";

export default async function handler(request: Request) {
  try {
    const response = await fetch('https://owtufhdsuuyrgmxytclj.functions.supabase.co/sitemap', {
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
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=1800' // Cache for 30 minutes
      },
    });
  } catch (error) {
    console.error('Error in sitemap edge function:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://not-noise.vercel.app</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>
</urlset>`,
      {
        headers: {
          'Content-Type': 'application/xml',
        },
        status: 500
      }
    );
  }
}
