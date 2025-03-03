
// Shared utilities for sitemap generation
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Setup Supabase client
export const setupSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

// Get sitemap log info
export const getSitemapLog = async (supabase: any, type: string) => {
  const { data, error } = await supabase
    .from('sitemap_logs')
    .select('*')
    .eq('type', type)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching sitemap log:', error);
    return null;
  }

  return data?.[0] || null;
};

// Update or create sitemap log
export const updateSitemapLog = async (
  supabase: any, 
  type: string, 
  status: string, 
  url_count?: number, 
  file_size?: number,
  error_message?: string
) => {
  const timestamp = new Date();
  
  const { data, error } = await supabase
    .from('sitemap_logs')
    .insert({
      type,
      status,
      url_count: url_count || 0,
      file_size: file_size || 0,
      error_message,
      created_at: timestamp.toISOString(),
    })
    .select();

  if (error) {
    console.error('Error updating sitemap log:', error);
  }

  return data?.[0] || null;
};

// Get sitemap status
export const getSitemapStatus = async (supabase: any) => {
  const { data, error } = await supabase
    .from('sitemap_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching sitemap status:', error);
    return [];
  }

  return data || [];
};

// Save sitemap to storage
export const saveSitemapToStorage = async (supabase: any, filename: string, content: string) => {
  const { data, error } = await supabase
    .storage
    .from('sitemaps')
    .upload(filename, content, {
      contentType: 'application/xml',
      upsert: true,
    });

  if (error) {
    console.error(`Error saving ${filename} to storage:`, error);
    throw error;
  }

  return data;
};

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
