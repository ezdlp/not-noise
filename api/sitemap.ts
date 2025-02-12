
import { SUPABASE_ANON_KEY } from '@/integrations/supabase/client';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  try {
    const response = await fetch('https://owtufhdsuuyrgmxytclj.functions.supabase.co/sitemap', {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
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
