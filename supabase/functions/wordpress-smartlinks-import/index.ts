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
    // First, handle the outer string serialization (s:425:"...")
    const outerMatch = serializedLinks.match(/^s:(\d+):"(.*)"$/);
    if (!outerMatch) {
      console.error('Invalid outer serialization format');
      throw new Error('Invalid outer serialization format');
    }

    const [, lengthStr, innerContent] = outerMatch;
    console.log('Parsed outer serialization:', { declaredLength: lengthStr, actualLength: innerContent.length });

    // Parse the inner array serialization
    const arrayMatch = innerContent.match(/^a:(\d+):\{(.*)\}$/);
    if (!arrayMatch) {
      console.error('Invalid array serialization format');
      throw new Error('Invalid array serialization format');
    }

    const [, count, content] = arrayMatch;
    console.log(`Found ${count} platform entries to parse`);

    const links: PlatformLink[] = [];
    let position = 0;
    const pairs = content.split(/(?<="})/); // Split on closing quotes+brace

    for (const pair of pairs) {
      if (!pair.trim()) continue;

      // Parse platform key
      const keyMatch = pair.match(/s:(\d+):"([^"]+)"/);
      if (!keyMatch) continue;
      const platformKey = keyMatch[2];
      
      // Find the corresponding value
      const valueMatch = pair.match(/s:(\d+):"([^"]*)"/g)?.[1];
      if (!valueMatch) continue;

      const urlMatch = valueMatch.match(/s:(\d+):"([^"]*)"/);
      if (!urlMatch) continue;
      
      const url = urlMatch[2];
      console.log(`Processing platform: ${platformKey}, URL: ${url}`);

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

    console.log('Final parsed platform links:', links);
    return links;
  } catch (error) {
    console.error('Error parsing platform links:', error);
    console.error('Input that caused error:', serializedLinks);
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
    
    if (!file || !(file instanceof File)) {
      throw new Error('No file uploaded');
    }

    const text = await file.text();
    console.log('Parsing XML file...');
    const xmlDoc = parse(text);

    if (!xmlDoc || !xmlDoc.rss || !xmlDoc.rss.channel) {
      throw new Error('Invalid XML file structure');
    }

    const items = xmlDoc.rss.channel.item || [];
    console.log(`Found ${items.length} items in XML`);

    const results = {
      total: items.length,
      success: 0,
      errors: [] as { link: string; error: string }[],
      unassigned: [] as string[]
    };

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') as string,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    );

    for (const item of items) {
      try {
        const title = extractCDATAContent(item.title) || '';
        console.log(`Processing link: ${title}`);

        const creatorEmail = extractCDATAContent(item['dc:creator']);
        if (!creatorEmail) {
          console.log('No creator email found, skipping');
          results.unassigned.push(title);
          continue;
        }

        console.log(`Looking for user with email: ${creatorEmail}`);
        const { data: userData, error: userError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', creatorEmail)
          .single();

        if (userError || !userData) {
          console.log(`No matching user found for email: ${creatorEmail}`);
          results.unassigned.push(title);
          continue;
        }

        const metas = item['wp:postmeta'] || [];
        let artistName = '';
        let artworkUrl = '';
        let platformLinksData = null;

        for (const meta of metas) {
          const key = extractCDATAContent(meta['wp:meta_key']);
          const value = extractCDATAContent(meta['wp:meta_value']);

          if (key === '_links' && value) {
            console.log('Found platform links data:', value);
            platformLinksData = value;
          } else if (key === '_artist_name' && value) {
            artistName = value;
          } else if (key === '_default_image' && value) {
            artworkUrl = value;
          }
        }

        // Create smart link using admin client and get the inserted record
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

        console.log('Successfully created smart link:', smartLink);

        if (platformLinksData) {
          console.log('Processing platform links data:', platformLinksData);
          const platformLinks = parsePlatformLinks(platformLinksData);
          console.log('Parsed platform links:', platformLinks);

          if (platformLinks.length > 0) {
            const platformLinksWithId = platformLinks.map(pl => ({
              ...pl,
              smart_link_id: smartLink.id
            }));

            console.log('Attempting to insert platform links:', platformLinksWithId);

            const { error: platformError } = await supabaseAdmin
              .from('platform_links')
              .insert(platformLinksWithId);

            if (platformError) {
              console.error('Error inserting platform links:', platformError);
              throw new Error(`Failed to insert platform links: ${platformError.message}`);
            }
            console.log('Successfully inserted platform links');
          } else {
            console.log('No valid platform links found to insert');
          }
        }

        results.success++;
        console.log(`Successfully processed item: ${title}`);

      } catch (error) {
        console.error('Error processing item:', error);
        results.errors.push({
          link: extractCDATAContent(item.title) || 'Unknown',
          error: error.message
        });
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
