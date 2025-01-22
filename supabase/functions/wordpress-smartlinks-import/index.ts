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
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function parsePHPSerializedString(input: string) {
  if (!input) {
    console.log('Empty input for PHP serialized string');
    return {};
  }

  const links: Record<string, string> = {};
  const pattern = /s:\d+:"([^"]+)"\s*;\s*s:\d+:"([^"]*)"/g;
  let match;

  try {
    while ((match = pattern.exec(input)) !== null) {
      const [, key, value] = match;
      if (key && value) {
        links[key] = value;
      }
    }
  } catch (error) {
    console.error('Error parsing PHP serialized string:', error);
  }

  return links;
}

async function processSmartLink(supabase: any, item: any, userId: string) {
  if (!item || !userId) {
    console.error('Invalid input:', { item, userId });
    throw new Error('Invalid input for processing smart link');
  }

  try {
    console.log('Processing smart link:', item.title);
    
    const platformLinks = item.platform_links;
    if (!platformLinks) {
      console.warn('No platform links found for:', item.title);
      throw new Error("No platform links found");
    }

    const links = parsePHPSerializedString(platformLinks);
    const validPlatformLinks = [];

    for (const [platformKey, url] of Object.entries(links)) {
      if (!url || !isValidUrl(url)) {
        console.warn(`Invalid URL for platform ${platformKey}:`, url);
        continue;
      }

      const mapping = platformMappings[platformKey as keyof typeof platformMappings];
      if (!mapping) {
        console.warn(`No mapping found for platform: ${platformKey}`);
        continue;
      }

      validPlatformLinks.push({
        platform_id: mapping.id,
        platform_name: mapping.name,
        url: url,
      });
    }

    if (validPlatformLinks.length === 0) {
      console.warn('No valid platform links found for:', item.title);
      throw new Error("No valid platform links found");
    }

    const slug = (item.title || 'untitled')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    console.log('Creating smart link with slug:', slug);

    const { data: smartLink, error: smartLinkError } = await supabase
      .from('smart_links')
      .insert({
        title: item.title || 'Untitled',
        artist_name: item.artist_name || 'Unknown Artist',
        artwork_url: item.artwork_url,
        user_id: userId,
        slug: slug,
      })
      .select()
      .single();

    if (smartLinkError) {
      console.error('Error creating smart link:', smartLinkError);
      throw smartLinkError;
    }

    console.log('Smart link created:', smartLink.id);

    const platformLinksToInsert = validPlatformLinks.map(link => ({
      smart_link_id: smartLink.id,
      platform_id: link.platform_id,
      platform_name: link.platform_name,
      url: link.url,
    }));

    const { error: platformLinksError } = await supabase
      .from('platform_links')
      .insert(platformLinksToInsert);

    if (platformLinksError) {
      console.error('Error creating platform links:', platformLinksError);
      throw platformLinksError;
    }

    console.log('Platform links created for:', smartLink.id);
    return smartLink;
  } catch (error) {
    console.error("Error processing smart link:", error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting import process...');
    const formData = await req.formData();
    const file = formData.get('file');
    const testMode = formData.get('testMode') === 'true';
    
    if (!file || !(file instanceof File)) {
      throw new Error('No file uploaded');
    }

    console.log('File received:', file.name);
    const text = await file.text();
    let items;
    
    try {
      console.log('Attempting to parse file as JSON...');
      items = JSON.parse(text);
    } catch (e) {
      console.log('JSON parse failed, attempting XML parse...');
      const xmlDoc = parse(text);
      
      if (!xmlDoc?.rss?.channel?.item) {
        console.error('Invalid WordPress export file structure');
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

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('No valid items found in the import file');
    }

    console.log(`Found ${items.length} items to process`);

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
      console.error('No admin user found');
      throw new Error('No admin user found');
    }

    const limitedItems = testMode ? [items[0]] : items;
    console.log(`Processing ${limitedItems.length} items...`);

    const results = {
      total: limitedItems.length,
      success: 0,
      errors: [] as { link: string; error: string }[],
      unassigned: [] as string[],
    };

    for (const item of limitedItems) {
      try {
        await processSmartLink(supabase, item, adminUser.user_id);
        results.success++;
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Error processing item:', item.title, error);
        results.errors.push({
          link: item.title || 'Untitled',
          error: error.message,
        });
      }
    }

    console.log('Import completed:', results);
    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Import error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});