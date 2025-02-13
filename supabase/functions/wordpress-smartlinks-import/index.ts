import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SAXParser } from "https://deno.land/x/xmlp@v0.3.0/mod.ts";

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

async function processItem(
  item: Record<string, any>,
  supabaseAdmin: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const title = item.title || '';
    console.log(`Processing link: ${title}`);

    const creatorEmail = item['dc:creator'];
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
      if (meta['wp:meta_key'] === '_links' && meta['wp:meta_value']) {
        platformLinksData = meta['wp:meta_value'];
      } else if (meta['wp:meta_key'] === '_artist_name' && meta['wp:meta_value']) {
        artistName = meta['wp:meta_value'];
      } else if (meta['wp:meta_key'] === '_default_image' && meta['wp:meta_value']) {
        artworkUrl = meta['wp:meta_value'];
      }
    }

    const { data: smartLink, error: insertError } = await supabaseAdmin
      .from('smart_links')
      .insert({
        user_id: userData.id,
        title,
        artist_name: artistName || 'Unknown Artist',
        artwork_url: artworkUrl || null,
        slug: item['wp:post_name'] || undefined
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

    const results = {
      total: 0,
      success: 0,
      errors: [] as { link: string; error: string }[],
      unassigned: [] as string[]
    };

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') as string,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    );

    const text = await file.text();
    const parser = new SAXParser();
    let currentItem: Record<string, any> | null = null;
    let currentTag = '';
    let currentMetaKey = '';
    let itemCount = 0;
    let processingItem = false;
    
    parser.on('startElement', async (name, attrs) => {
      currentTag = name;
      if (name === 'item') {
        processingItem = true;
        currentItem = {};
      }
    });

    parser.on('endElement', async (name) => {
      if (name === 'item' && currentItem) {
        itemCount++;
        
        if (!testMode || itemCount <= 10) {
          const result = await processItem(currentItem, supabaseAdmin);
          results.total++;
          
          if (result.success) {
            results.success++;
          } else if (result.error === 'No matching user found' || result.error === 'No creator email found') {
            results.unassigned.push(currentItem.title || 'Unknown');
          } else {
            results.errors.push({ 
              link: currentItem.title || 'Unknown', 
              error: result.error || 'Unknown error' 
            });
          }
          
          // Add delay between items
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        currentItem = null;
        processingItem = false;
      }
      currentTag = '';
    });

    parser.on('text', (text) => {
      if (processingItem && currentItem && text.trim()) {
        if (currentTag.startsWith('wp:meta')) {
          if (currentTag === 'wp:meta_key') {
            currentMetaKey = text;
          } else if (currentTag === 'wp:meta_value' && currentMetaKey) {
            if (!currentItem['wp:postmeta']) {
              currentItem['wp:postmeta'] = [];
            }
            currentItem['wp:postmeta'].push({
              'wp:meta_key': currentMetaKey,
              'wp:meta_value': text
            });
          }
        } else {
          currentItem[currentTag] = text;
        }
      }
    });

    await parser.parse(text);

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
