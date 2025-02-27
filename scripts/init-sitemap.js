
#!/usr/bin/env node

// A script to initialize the sitemap in the database

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Replace these with your actual Supabase credentials
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://owtufhdsuuyrgmxytclj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// A minimal initial sitemap
const initialSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://soundraiser.io/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://soundraiser.io/pricing</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://soundraiser.io/blog</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;

async function initSitemap() {
  console.log('🔄 Initializing sitemap in database...');
  
  try {
    const { data, error } = await supabase
      .from('sitemap_cache')
      .upsert(
        {
          key: 'sitemap.xml',
          content: initialSitemap,
          etag: Date.now().toString()
        },
        { onConflict: 'key' }
      );
      
    if (error) {
      console.error('❌ Error initializing sitemap:', error);
    } else {
      console.log('✅ Sitemap successfully initialized in database');
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

initSitemap();
