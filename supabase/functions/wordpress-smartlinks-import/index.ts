import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parse } from "https://deno.land/x/xml@2.1.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlatformLink {
  platform_id: string;
  platform_name: string;
  url: string;
}

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
  console.log("Parsing PHP string:", input);
  const links: Record<string, string> = {};

  // Extract key-value pairs using regex
  const pattern = /s:\d+:"([^"]+)"\s*;\s*s:\d+:"([^"]*)"/g;
  let match;

  while ((match = pattern.exec(input)) !== null) {
    const [, key, value] = match;
    if (key && value) {
      links[key] = value;
    }
  }

  console.log("Parsed links:", links);
  return links;
}

function validateAndMapPlatformLinks(links: Record<string, string>): PlatformLink[] {
  const validLinks: PlatformLink[] = [];

  for (const [platformKey, url] of Object.entries(links)) {
    // Skip empty URLs
    if (!url) continue;

    // Check if this is a valid platform
    const platformMapping = platformMappings[platformKey as keyof typeof platformMappings];
    if (!platformMapping) {
      console.log(`Skipping invalid platform key: ${platformKey}`);
      continue;
    }

    // Validate URL
    if (!isValidUrl(url)) {
      console.log(`Skipping invalid URL for ${platformKey}: ${url}`);
      continue;
    }

    validLinks.push({
      platform_id: platformMapping.id,
      platform_name: platformMapping.name,
      url: url,
    });
  }

  console.log(`Found ${validLinks.length} valid links`);
  return validLinks;
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
  const platformLinks = item.platform_links;
  if (!platformLinks) {
    throw new Error("No platform links found");
  }

  const links = parsePHPSerializedString(platformLinks);
  const validPlatformLinks = validateAndMapPlatformLinks(links);

  if (validPlatformLinks.length === 0) {
    throw new Error("No valid platform links found");
  }

  // Generate a unique slug
  const baseSlug = item.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const uniqueSlug = await generateUniqueSlug(supabase, baseSlug);

  // Insert smart link
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

  // Insert platform links
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
      // First try parsing as JSON
      items = JSON.parse(content);
    } catch (e) {
      // If JSON parsing fails, try parsing as XML
      console.log("JSON parsing failed, attempting XML parse");
      const xmlDoc = parse(content);
      
      // Extract items from WordPress XML structure
      if (!xmlDoc.rss?.channel?.item) {
        throw new Error("Invalid WordPress export file structure");
      }
      
      items = Array.isArray(xmlDoc.rss.channel.item) 
        ? xmlDoc.rss.channel.item 
        : [xmlDoc.rss.channel.item];
      
      // Transform XML items to match expected format
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

    console.log(`Starting import in ${testMode ? 'TEST' : 'PRODUCTION'} mode`);

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

    const chunkSize = 5;
    const chunks = [];
    const limitedItems = testMode ? items.slice(0, 10) : items;
    
    for (let i = 0; i < limitedItems.length; i += chunkSize) {
      chunks.push(limitedItems.slice(i, i + chunkSize));
    }

    const results = {
      total: limitedItems.length,
      success: 0,
      errors: [] as { link: string; error: string }[],
      unassigned: [] as string[],
    };

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1} of ${chunks.length}`);
      const chunk = chunks[i];

      for (const item of chunk) {
        try {
          await processItem(supabase, item, adminUser.user_id);
          results.success++;
        } catch (error) {
          console.error("Error processing item:", error);
          results.errors.push({
            link: item.title,
            error: error.message,
          });
        }
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