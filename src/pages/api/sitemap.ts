
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Call the Supabase Edge Function to generate the sitemap
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const response = await fetch(`${SUPABASE_URL}/functions/v1/sitemap`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Sitemap API error (${response.status}): ${errorText}`);
      return res.status(response.status).send(`Error fetching sitemap: ${errorText}`);
    }

    const sitemap = await response.text();
    
    // Set appropriate headers for XML content
    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    
    return res.status(200).send(sitemap);
  } catch (error) {
    console.error('Unexpected error in sitemap API route:', error);
    return res.status(500).send(`Error generating sitemap: ${error.message}`);
  }
}
