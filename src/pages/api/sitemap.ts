
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { segment } = req.query;
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('sitemap', {
      body: { segment: segment || null },
    });

    if (error) {
      console.error('Error fetching sitemap:', error);
      throw error;
    }

    // Set proper headers
    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.setHeader('X-Robots-Tag', 'noindex');

    // Send the response
    res.status(200).send(data);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    
    // Return a minimal valid XML even in case of error
    const errorXml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Error generating sitemap -->
</urlset>`;
    
    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    res.status(500).send(errorXml);
  }
}
