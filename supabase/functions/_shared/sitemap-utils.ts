// Shared utilities for sitemap generation
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function xmlResponse(content: string, options: { etag?: string; maxAge?: number } = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/xml; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
  };
  
  if (options.etag) {
    headers['ETag'] = `"${options.etag}"`;
  }
  
  headers['Cache-Control'] = `public, max-age=${options.maxAge || 3600}, stale-while-revalidate=86400`;
  
  return new Response(content, { headers });
}

export function xmlErrorResponse(message: string, status = 500) {
  const errorXml = `<?xml version="1.0" encoding="UTF-8"?>
<error>
  <status>${status}</status>
  <message>${message}</message>
  <timestamp>${new Date().toISOString()}</timestamp>
</error>`;

  return new Response(errorXml, { 
    status,
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    }
  });
}

export async function generateETag(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function createAdminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );
}

export function createAnonClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_ANON_KEY') || ''
  );
}

export async function logSitemapEvent(client: any, status: 'success' | 'error' | 'warning', message: string, source: string, details: Record<string, any> = {}) {
  try {
    await client
      .from('sitemap_logs')
      .insert({
        status,
        message,
        source,
        details,
      });
  } catch (error) {
    console.error(`Failed to log sitemap event: ${error.message}`);
  }
}

export const SITE_URL = 'https://soundraiser.io';
export const BATCH_SIZE = 1000; // URLs per sitemap file

export function generateSitemapIndexXml(totalUrls: number): string {
  const baseUrl = 'https://soundraiser.io';
  const sitemapCount = Math.ceil(totalUrls / 50000); // 50k URLs per sitemap as per protocol
  const sitemaps = [];

  for (let i = 1; i <= sitemapCount; i++) {
    sitemaps.push(`
    <sitemap>
      <loc>${baseUrl}/sitemap-${i}.xml</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${sitemaps.join('')}
    </sitemapindex>`;
}

export function generateSitemapXml(urls: Array<{url: string, updated_at: Date, changefreq?: string, priority?: number}>): string {
  const urlsets = urls.map(({ url, updated_at, changefreq = 'weekly', priority = 0.7 }) => `
    <url>
      <loc>${url}</loc>
      <lastmod>${updated_at.toISOString()}</lastmod>
      <changefreq>${changefreq}</changefreq>
      <priority>${priority}</priority>
    </url>`);

  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urlsets.join('')}
    </urlset>`;
}
