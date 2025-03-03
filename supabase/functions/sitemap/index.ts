
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { setupSupabaseClient, generateSitemapIndexXml, generateSitemapXml } from '../_shared/sitemap-utils.ts';

console.log('Sitemap function loaded');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const params = new URLSearchParams(url.search);
    const type = params.get('type') || 'index';
    
    // Initialize Supabase client
    const supabase = setupSupabaseClient();
    
    if (type === 'index') {
      // Get total URL count for sitemap index
      const { count, error } = await supabase
        .from('sitemap_urls')
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw new Error(`Error counting URLs: ${error.message}`);
      }

      const xml = generateSitemapIndexXml(count || 0);
      
      return new Response(xml, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml',
        },
      });
    } else {
      // Handle numbered sitemap files
      const sitemapNumber = parseInt(type.replace('sitemap-', ''));
      if (isNaN(sitemapNumber)) {
        throw new Error('Invalid sitemap number');
      }

      const { data, error } = await supabase
        .from('sitemap_urls')
        .select('url, updated_at, changefreq, priority')
        .range((sitemapNumber - 1) * 50000, sitemapNumber * 50000 - 1);

      if (error) {
        throw new Error(`Error fetching URLs: ${error.message}`);
      }

      const xml = generateSitemapXml(data || []);
      
      return new Response(xml, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml',
        },
      });
    }
  } catch (error) {
    console.error('Sitemap error:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
