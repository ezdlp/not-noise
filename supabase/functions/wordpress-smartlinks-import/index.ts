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
  'youtubeMusic': { id: 'youtube_music', name: 'YouTube Music' },
};

function extractCData(text: string): string {
  const match = text.match(/<!\[CDATA\[(.*?)\]\]>/);
  return match ? match[1].trim() : text.trim();
}

function getMetaValue(item: any, key: string): string | null {
  if (!item['wp:postmeta']) return null;
  
  const postmeta = Array.isArray(item['wp:postmeta']) 
    ? item['wp:postmeta'] 
    : [item['wp:postmeta']];

  const meta = postmeta.find((meta: any) => 
    extractCData(meta['wp:meta_key']?.[0] || '') === key
  );

  return meta ? extractCData(meta['wp:meta_value']?.[0] || '') : null;
}

function parsePlatformLinks(input: string): Record<string, string> {
  console.log('Parsing platform links from:', input);
  
  if (!input) {
    console.log('Empty input for platform links');
    return {};
  }

  const links: Record<string, string> = {};
  
  try {
    // Remove the string length prefix and array length prefix
    const cleanInput = input.replace(/^s:\d+:"/, '').replace(/^a:\d+:{/, '');
    
    // Parse the serialized PHP array format
    const matches = cleanInput.matchAll(/s:\d+:"([^"]+)";s:\d+:"([^"]*)"/g);
    for (const match of matches) {
      const [, key, value] = match;
      if (key && value) {
        links[key] = value;
        console.log(`Found link - Platform: ${key}, URL: ${value}`);
      }
    }
  } catch (error) {
    console.error('Error parsing platform links:', error);
  }

  return links;
}

async function processSmartLink(supabase: any, item: any, userId: string) {
  try {
    console.log('Processing smart link:', extractCData(item.title?.[0] || ''));
    
    // Extract post type and verify it's a custom link
    const postType = extractCData(item['wp:post_type']?.[0] || '');
    console.log('Post type:', postType);
    
    if (postType !== 'custom_links') {
      console.warn('Not a custom link post type:', postType);
      return null;
    }

    // Extract metadata
    const platformLinksData = getMetaValue(item, '_links');
    console.log('Raw platform links data:', platformLinksData);

    if (!platformLinksData) {
      console.warn('No platform links found');
      return null;
    }

    const links = parsePlatformLinks(platformLinksData);
    console.log('Parsed platform links:', links);

    const validPlatformLinks = [];
    for (const [platformKey, url] of Object.entries(links)) {
      if (!url) continue;

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
      console.warn('No valid platform links found');
      return null;
    }

    const title = extractCData(item.title?.[0] || '');
    const artistName = getMetaValue(item, '_artist_name') || 'Unknown Artist';
    const artworkUrl = getMetaValue(item, '_default_image');
    const postName = extractCData(item['wp:post_name']?.[0] || '');
    
    // Meta pixel data
    const metaPixelEnabled = getMetaValue(item, '_fb_pixel') === '1';
    const metaPixelId = getMetaValue(item, '_fb_pixel_id');
    const metaViewEvent = getMetaValue(item, '_fb_pixel_page_load_event');
    const metaClickEvent = getMetaValue(item, '_fb_pixel_link_click_event');

    console.log('Creating smart link with:', { 
      title, 
      artistName, 
      postName,
      metaPixelEnabled,
      platformCount: validPlatformLinks.length 
    });

    const { data: smartLink, error: smartLinkError } = await supabase
      .from('smart_links')
      .insert({
        title,
        artist_name: artistName,
        artwork_url: artworkUrl,
        user_id: userId,
        slug: postName,
        meta_pixel_id: metaPixelEnabled ? metaPixelId : null,
        meta_view_event: metaPixelEnabled ? metaViewEvent : null,
        meta_click_event: metaPixelEnabled ? metaClickEvent : null,
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

    console.log('Platform links created:', platformLinksToInsert.length);
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
    
    console.log('Parsing XML file...');
    const xmlDoc = parse(text);
    
    if (!xmlDoc?.rss?.channel?.item) {
      console.error('Invalid WordPress export file structure');
      throw new Error("Invalid WordPress export file structure");
    }
    
    const items = Array.isArray(xmlDoc.rss.channel.item) 
      ? xmlDoc.rss.channel.item 
      : [xmlDoc.rss.channel.item];

    // Filter only custom_links post types
    const smartLinkItems = items.filter((item: any) => {
      const postType = extractCData(item['wp:post_type']?.[0] || '');
      console.log('Found post type:', postType);
      return postType === 'custom_links';
    });

    console.log(`Found ${smartLinkItems.length} smart link items to process`);

    if (smartLinkItems.length === 0) {
      throw new Error('No valid items found in the import file');
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
      console.error('No admin user found');
      throw new Error('No admin user found');
    }

    const limitedItems = testMode ? smartLinkItems.slice(0, 1) : smartLinkItems;
    console.log(`Processing ${limitedItems.length} items...`);

    const results = {
      total: limitedItems.length,
      success: 0,
      errors: [] as { link: string; error: string }[],
      unassigned: [] as string[],
    };

    for (const item of limitedItems) {
      try {
        const smartLink = await processSmartLink(supabase, item, adminUser.user_id);
        if (smartLink) {
          results.success++;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Error processing item:', extractCData(item.title?.[0] || ''), error);
        results.errors.push({
          link: extractCData(item.title?.[0] || 'Untitled'),
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