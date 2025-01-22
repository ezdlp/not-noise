import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parse } from "https://deno.land/x/xml@2.1.1/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const platformMapping: Record<string, string> = {
  'spotify': 'spotify',
  'appleMusic': 'appleMusic',
  'amazonMusic': 'amazonMusic',
  'youtubeMusic': 'youtubeMusic',
  'deezer': 'deezer',
  'soundcloud': 'soundcloud',
  'youtube': 'youtube',
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

function unserializePhpArray(serialized: string): Record<string, string> {
  try {
    console.log('Attempting to unserialize:', serialized);
    
    // Remove outer quotes and length indicator
    const cleaned = serialized.replace(/^s:\d+:"(.*?)";$/, '$1');
    console.log('Cleaned string:', cleaned);
    
    // Extract the array part
    const arrayMatch = cleaned.match(/^a:(\d+):{(.+)}$/);
    if (!arrayMatch) {
      console.log('No array match found');
      return {};
    }
    
    const pairs = arrayMatch[2].match(/s:\d+:"([^"]+)";s:\d+:"([^"]+)";/g) || [];
    console.log('Found pairs:', pairs);
    
    const result: Record<string, string> = {};
    
    pairs.forEach(pair => {
      const [key, value] = pair.match(/s:\d+:"([^"]+)";/g)?.map(s => 
        s.replace(/^s:\d+:"(.*?)";$/, '$1')
      ) || [];
      
      if (key && value) {
        const mappedPlatform = platformMapping[key];
        if (mappedPlatform) {
          result[mappedPlatform] = value;
          console.log(`Mapped platform ${key} -> ${mappedPlatform}: ${value}`);
        }
      }
    });
    
    console.log('Final platform links:', result);
    return result;
  } catch (error) {
    console.error('Error unserializing PHP array:', error);
    return {};
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    console.log("Starting import process...");
    const formData = await req.formData();
    const file = formData.get('file');
    const testMode = formData.get('testMode') === 'true';
    
    if (!file || !(file instanceof File)) {
      throw new Error('No file uploaded');
    }

    console.log(`File received: ${file.name}, Test mode: ${testMode}`);
    const text = await file.text();
    
    console.log("Parsing XML file...");
    const xmlDoc = parse(text);
    
    if (!xmlDoc.rss?.channel?.item) {
      throw new Error('Invalid WordPress export file structure');
    }

    const items = Array.isArray(xmlDoc.rss.channel.item) 
      ? xmlDoc.rss.channel.item 
      : [xmlDoc.rss.channel.item];

    console.log(`Found ${items.length} items in XML`);

    const extractCData = (node: any): string => {
      if (!node) return '';
      if (Array.isArray(node)) return node[0];
      if (typeof node === 'string') return node;
      return '';
    };

    const validItems = [];
    const invalidItems = [];
    let processedCount = 0;
    
    for (const item of items) {
      try {
        const postType = extractCData(item['wp:post_type']);
        console.log(`Processing item of type: ${postType}`);

        if (postType === 'custom_links') {
          const title = extractCData(item.title);
          console.log(`Processing custom link: ${title}`);

          const creator = extractCData(item['dc:creator']);
          console.log(`Found creator email: ${creator}`);

          let userId = null;
          if (creator) {
            const { data: profile } = await supabaseClient
              .from('profiles')
              .select('id')
              .eq('email', creator)
              .maybeSingle();

            if (profile) {
              userId = profile.id;
              console.log(`Found matching user: ${userId}`);
            }
          }

          if (!userId) {
            console.log('Falling back to admin user...');
            const { data: adminUser } = await supabaseClient
              .from('user_roles')
              .select('user_id')
              .eq('role', 'admin')
              .limit(1)
              .single();
            
            if (!adminUser) {
              throw new Error('No admin user found');
            }
            
            userId = adminUser.user_id;
            console.log(`Using admin user as fallback: ${userId}`);
          }

          const postMeta = Array.isArray(item['wp:postmeta']) ? item['wp:postmeta'] : [item['wp:postmeta']];
          console.log(`Found ${postMeta.length} meta fields`);

          let artistName = 'Unknown Artist';
          let artworkUrl = '';
          let platformLinks: Record<string, string> = {};

          for (const meta of postMeta) {
            const metaKey = extractCData(meta['wp:meta_key']);
            const metaValue = extractCData(meta['wp:meta_value']);
            console.log(`Processing meta: ${metaKey}`);

            if (metaKey === '_artist_name') {
              artistName = metaValue || artistName;
            } else if (metaKey === '_default_image') {
              artworkUrl = metaValue || '';
            } else if (metaKey === '_links' && metaValue) {
              console.log('Found links meta value:', metaValue);
              platformLinks = unserializePhpArray(metaValue);
              console.log('Extracted platform links:', platformLinks);
            }
          }

          const formattedPlatformLinks = Object.entries(platformLinks).map(([platform, url]) => ({
            platform_id: platform,
            platform_name: platform
              .replace(/([A-Z])/g, ' $1')
              .trim()
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' '),
            url
          }));

          console.log('Formatted platform links:', formattedPlatformLinks);

          validItems.push({
            title,
            artist_name: artistName,
            artwork_url: artworkUrl,
            user_id: userId,
            platform_links: formattedPlatformLinks
          });
          console.log(`Successfully processed item: ${title}`);
        }

        processedCount++;
        if (testMode && processedCount >= 10) {
          console.log("Test mode: stopping after 10 items");
          break;
        }
      } catch (error) {
        console.error('Error processing item:', error);
        invalidItems.push({ error: error.message });
      }
    }

    console.log(`Found ${validItems.length} valid items and ${invalidItems.length} invalid items`);

    if (validItems.length === 0) {
      throw new Error(`No valid items found in the import file. Invalid items: ${JSON.stringify(invalidItems)}`);
    }

    const importedItems = [];
    const errors = [];

    for (const item of validItems) {
      try {
        console.log(`Importing smart link: ${item.title}`);
        const { data: smartLink, error: smartLinkError } = await supabaseClient
          .from('smart_links')
          .insert({
            title: item.title,
            artist_name: item.artist_name,
            artwork_url: item.artwork_url,
            user_id: item.user_id
          })
          .select()
          .single();

        if (smartLinkError) throw smartLinkError;

        if (item.platform_links.length > 0) {
          console.log(`Inserting ${item.platform_links.length} platform links for ${item.title}`);
          const platformLinksToInsert = item.platform_links.map(pl => ({
            ...pl,
            smart_link_id: smartLink.id
          }));

          const { error: platformLinksError } = await supabaseClient
            .from('platform_links')
            .insert(platformLinksToInsert);

          if (platformLinksError) throw platformLinksError;
          console.log(`Successfully inserted platform links for ${item.title}`);
        }

        importedItems.push(smartLink);
        console.log(`Successfully imported: ${item.title}`);
      } catch (error) {
        console.error('Error importing item:', error);
        errors.push({
          title: item.title,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: importedItems.length,
        errors,
        total: validItems.length,
        invalidItems
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});