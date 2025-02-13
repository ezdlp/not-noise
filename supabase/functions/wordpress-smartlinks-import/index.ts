
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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

const platformMapping: Record<string, string> = {
  'spotify': 'spotify',
  'apple_music': 'appleMusic',
  'appleMusic': 'appleMusic',
  'amazon_music': 'amazonMusic',
  'amazonMusic': 'amazonMusic',
  'youtube_music': 'youtubeMusic',
  'youtubeMusic': 'youtubeMusic',
  'youtube': 'youtube',
  'deezer': 'deezer',
  'soundcloud': 'soundcloud',
  'itunes': 'itunes',
  'tidal': 'tidal',
  'anghami': 'anghami',
  'napster': 'napster',
  'boomplay': 'boomplay',
  'yandex': 'yandex',
  'beatport': 'beatport',
  'bandcamp': 'bandcamp',
  'audius': 'audius'
};

const platformDisplayNames: Record<string, string> = {
  'spotify': 'Spotify',
  'appleMusic': 'Apple Music',
  'amazonMusic': 'Amazon Music',
  'youtubeMusic': 'YouTube Music',
  'youtube': 'YouTube',
  'deezer': 'Deezer',
  'soundcloud': 'SoundCloud',
  'itunes': 'iTunes',
  'tidal': 'Tidal',
  'anghami': 'Anghami',
  'napster': 'Napster',
  'boomplay': 'Boomplay',
  'yandex': 'Yandex Music',
  'beatport': 'Beatport',
  'bandcamp': 'Bandcamp',
  'audius': 'Audius'
};

function parsePlatformLinks(serializedLinks: string): PlatformLink[] {
  console.log('Starting platform links parsing with input:', serializedLinks);
  
  try {
    // Extract the inner array content from the outer serialized string
    const arrayMatch = serializedLinks.match(/^s:\d+:"(a:\d+:\{.*\})";$/);
    if (!arrayMatch) {
      console.error('Invalid serialized format');
      throw new Error('Invalid serialized format');
    }

    const arrayContent = arrayMatch[1];
    console.log('Extracted array content:', arrayContent);

    // Split the array content into key-value pairs
    const pairs = arrayContent.match(/s:\d+:"[^"]+";s:\d+:"[^"]*";/g) || [];
    console.log(`Found ${pairs.length} platform pairs`);

    const links: PlatformLink[] = [];

    for (const pair of pairs) {
      // Extract key and value from each pair
      const keyMatch = pair.match(/s:\d+:"([^"]+)";/);
      const valueMatch = pair.match(/;s:\d+:"([^"]*)";/);

      if (!keyMatch || !valueMatch) {
        console.warn('Skipping invalid pair:', pair);
        continue;
      }

      const platformKey = keyMatch[1];
      const url = valueMatch[1];

      // Skip empty URLs
      if (!url) {
        console.log(`Skipping ${platformKey} - empty URL`);
        continue;
      }

      // Map to our platform conventions
      const platformId = platformMapping[platformKey];
      if (!platformId) {
        console.warn(`Unknown platform type: ${platformKey}`);
        continue;
      }

      links.push({
        platform_id: platformId,
        platform_name: platformDisplayNames[platformId],
        url: url.trim()
      });
      
      console.log(`Added platform link:`, {
        platform_id: platformId,
        platform_name: platformDisplayNames[platformId],
        url: url.trim()
      });
    }

    console.log('Successfully parsed platform links:', links);
    return links;
  } catch (error) {
    console.error('Error parsing platform links:', error);
    console.error('Input that caused error:', serializedLinks);
    throw error;
  }
}

function extractCDATAContent(value: any): string {
  if (!value) return '';
  
  if (typeof value === 'string') return value;
  
  if (Array.isArray(value)) {
    if (value.length === 0) return '';
    const firstItem = value[0];
    
    if (typeof firstItem === 'object') {
      if (firstItem['#cdata']) return firstItem['#cdata'];
      if (firstItem['#text']) return firstItem['#text'];
      return firstItem;
    }
    
    return firstItem;
  }
  
  if (typeof value === 'object') {
    if (value['#cdata']) return value['#cdata'];
    if (value['#text']) return value['#text'];
    if (value.toString) return value.toString();
  }
  
  return '';
}

async function processItem(
  item: any,
  supabaseAdmin: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const title = extractCDATAContent(item.title) || '';
    console.log(`Processing link: ${title}`);

    const creatorEmail = extractCDATAContent(item['dc:creator']);
    if (!creatorEmail) {
      console.log('No creator email found, skipping');
      return { success: false, error: 'No creator email found' };
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', creatorEmail)
      .single();

    if (userError || !userData) {
      console.log(`No matching user found for email: ${creatorEmail}`);
      return { success: false, error: 'No matching user found' };
    }

    const metas = item['wp:postmeta'] || [];
    let artistName = '';
    let artworkUrl = '';
    let platformLinksData = null;

    for (const meta of metas) {
      const key = extractCDATAContent(meta['wp:meta_key']);
      const value = extractCDATAContent(meta['wp:meta_value']);

      if (key === '_links' && value) {
        platformLinksData = value;
      } else if (key === '_artist_name' && value) {
        artistName = value;
      } else if (key === '_default_image' && value) {
        artworkUrl = value;
      }
    }

    const { data: smartLink, error: insertError } = await supabaseAdmin
      .from('smart_links')
      .insert({
        user_id: userData.id,
        title,
        artist_name: artistName || 'Unknown Artist',
        artwork_url: artworkUrl || null,
        slug: extractCDATAContent(item['wp:post_name']) || undefined
      })
      .select()
      .single();

    if (insertError || !smartLink) {
      throw new Error(`Failed to insert smart link: ${insertError?.message}`);
    }

    if (platformLinksData) {
      const platformLinks = parsePlatformLinks(platformLinksData);

      if (platformLinks.length > 0) {
        const platformLinksWithId = platformLinks.map(pl => ({
          ...pl,
          smart_link_id: smartLink.id
        }));

        const { error: platformError } = await supabaseAdmin
          .from('platform_links')
          .insert(platformLinksWithId);

        if (platformError) {
          throw new Error(`Failed to insert platform links: ${platformError.message}`);
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error processing item:', error);
    return { success: false, error: error.message };
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

    const text = await file.text();
    console.log('Parsing XML file...');
    const xmlDoc = parse(text);

    if (!xmlDoc || !xmlDoc.rss || !xmlDoc.rss.channel) {
      throw new Error('Invalid XML file structure');
    }

    let items = xmlDoc.rss.channel.item || [];
    console.log(`Found ${items.length} items in XML`);

    // In test mode, only process first 10 items
    if (testMode) {
      items = items.slice(0, 10);
      console.log('Test mode: processing first 10 items only');
    }

    const results = {
      total: items.length,
      success: 0,
      errors: [] as { link: string; error: string }[],
      unassigned: [] as string[]
    };

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') as string,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    );

    // Reduce batch size to 10 items and increase delay between batches
    const BATCH_SIZE = 10;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(items.length / BATCH_SIZE)}`);
      
      // Process items sequentially within each batch to reduce memory usage
      for (const item of batch) {
        const result = await processItem(item, supabaseAdmin);
        const title = extractCDATAContent(item.title) || 'Unknown';
        
        if (result.success) {
          results.success++;
        } else if (result.error === 'No matching user found' || result.error === 'No creator email found') {
          results.unassigned.push(title);
        } else {
          results.errors.push({ link: title, error: result.error || 'Unknown error' });
        }
        
        // Add a small delay between individual items
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Longer delay between batches
      if (i + BATCH_SIZE < items.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Force garbage collection if available
        if (typeof Deno.heap === 'object' && Deno.heap.collections) {
          Deno.heap.collections();
        }
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing import:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
