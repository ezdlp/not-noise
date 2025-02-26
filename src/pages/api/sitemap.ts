
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { segment } = req.query;
    const format = req.query.format || 'html'; // Default to HTML
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('sitemap', {
      query: { 
        segment: segment || null,
        format
      }
    });

    if (error) {
      console.error('Error fetching sitemap:', error);
      throw error;
    }

    // Set proper headers based on format
    const contentType = format === 'html' ? 'text/html' : 'application/xml';
    res.setHeader('Content-Type', `${contentType}; charset=UTF-8`);
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    
    if (format === 'xml') {
      res.setHeader('X-Robots-Tag', 'noindex');
    }

    // Send the response
    res.status(200).send(data);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    
    // Return a minimal valid response based on format
    const errorContent = req.query.format === 'html'
      ? `<html><body><h1>Error</h1><p>${error.message}</p></body></html>`
      : `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Error generating sitemap -->
</urlset>`;
    
    res.setHeader('Content-Type', req.query.format === 'html' ? 'text/html' : 'application/xml');
    res.status(500).send(errorContent);
  }
}
