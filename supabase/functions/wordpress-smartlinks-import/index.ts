import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parse } from "https://deno.land/x/xml@2.1.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const platformMappings = {
  'appleMusic': { id: 'apple_music', name: 'Apple Music' },
  'spotify': { id: 'spotify', name: 'Spotify' },
  'soundcloud': { id: 'soundcloud', name: 'SoundCloud' },
  'itunes': { id: 'itunes', name: 'iTunes' },
  'deezer': { id: 'deezer', name: 'Deezer' },
  'amazonMusic': { id: 'amazon_music', name: 'Amazon Music' },
  'youtube': { id: 'youtube', name: 'YouTube' },
};

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function parsePHPSerializedString(input: string) {
  const links: Record<string, string> = {};
  const pattern = /s:\d+:"([^"]+)"\s*;\s*s:\d+:"([^"]*)"/g;
  let match;

  while ((match = pattern.exec(input)) !== null) {
    const [, key, value] = match;
    if (key && value) {
      links[key] = value;
    }
  }

  return links;
}

async function generateUniqueSlug(supabase: any, baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const { data } = await supabase
      .from('smart_links')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    
    if (!data) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

async function processItem(supabase: any, item: any, userId: string) {
  try {
    const platformLinks = item.platform_links;
    if (!platformLinks) {
      throw new Error("No platform links found");
    }

    const links = parsePHPSerializedString(platformLinks);
    const validPlatformLinks = [];

    for (const [platformKey, url] of Object.entries(links)) {
      if (!url || !isValidUrl(url)) continue;

      const mapping = platformMappings[platformKey as keyof typeof platformMappings];
      if (!mapping) continue;

      validPlatformLinks.push({
        platform_id: mapping.id,
        platform_name: mapping.name,
        url: url,
      });
    }

    if (validPlatformLinks.length === 0) {
      throw new Error("No valid platform links found");
    }

    const baseSlug = item.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    const uniqueSlug = await generateUniqueSlug(supabase, baseSlug);

    const { data: smartLink, error: smartLinkError } = await supabase
      .from('smart_links')
      .insert({
        title: item.title,
        artist_name: item.artist_name || 'Unknown Artist',
        artwork_url: item.artwork_url,
        user_id: userId,
        slug: uniqueSlug,
      })
      .select()
      .single();

    if (smartLinkError) throw smartLinkError;

    const platformLinksToInsert = validPlatformLinks.map(link => ({
      smart_link_id: smartLink.id,
      platform_id: link.platform_id,
      platform_name: link.platform_name,
      url: link.url,
    }));

    const { error: platformLinksError } = await supabase
      .from('platform_links')
      .insert(platformLinksToInsert);

    if (platformLinksError) throw platformLinksError;

    return smartLink;
  } catch (error) {
    console.error("Error processing item:", error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const testMode = formData.get('testMode') === 'true';
    
    if (!file || !(file instanceof File)) {
      throw new Error('No file uploaded');
    }

    const content = await file.text();
    let items;
    
    try {
      items = JSON.parse(content);
    } catch (e) {
      const xmlDoc = parse(content);
      
      if (!xmlDoc.rss?.channel?.item) {
        throw new Error("Invalid WordPress export file structure");
      }
      
      items = Array.isArray(xmlDoc.rss.channel.item) 
        ? xmlDoc.rss.channel.item 
        : [xmlDoc.rss.channel.item];
      
      items = items.map(item => ({
        title: item.title?.[0] || '',
        artist_name: item['wp:postmeta']?.find(meta => 
          meta['wp:meta_key']?.[0] === '_artist_name'
        )?.[0]?.['wp:meta_value']?.[0] || '',
        artwork_url: item['wp:postmeta']?.find(meta => 
          meta['wp:meta_key']?.[0] === '_artwork_url'
        )?.[0]?.['wp:meta_value']?.[0] || '',
        platform_links: item['wp:postmeta']?.find(meta => 
          meta['wp:meta_key']?.[0] === '_platform_links'
        )?.[0]?.['wp:meta_value']?.[0] || '',
      }));
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: adminUser } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (!adminUser?.user_id) {
      throw new Error('No admin user found');
    }

    const batchSize = 2;
    const limitedItems = testMode ? items.slice(0, 5) : items;
    const results = {
      total: limitedItems.length,
      success: 0,
      errors: [] as { link: string; error: string }[],
      unassigned: [] as string[],
    };

    for (let i = 0; i < limitedItems.length; i += batchSize) {
      const batch = limitedItems.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(limitedItems.length/batchSize)}`);

      for (const item of batch) {
        try {
          await processItem(supabase, item, adminUser.user_id);
          results.success++;
        } catch (error) {
          results.errors.push({
            link: item.title,
            error: error.message,
          });
        }
      }

      // Add a small delay between batches to prevent resource exhaustion
      if (i + batchSize < limitedItems.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Import error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});