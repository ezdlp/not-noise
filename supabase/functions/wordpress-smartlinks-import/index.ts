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

function unserializePhp(input: string): any {
  console.log('Starting PHP unserialization of:', input);
  let position = 0;

  function readLength(): number {
    const colonPos = input.indexOf(':', position);
    const length = parseInt(input.slice(position, colonPos));
    position = colonPos + 1;
    return length;
  }

  function readString(): string {
    const length = readLength();
    const str = input.slice(position + 1, position + length + 1);
    position += length + 3; // Skip quotes and semicolon
    console.log('Read string:', str);
    return str;
  }

  function readArray(): any {
    const length = readLength();
    position += 1; // Skip {
    const result: any = {};
    console.log('Reading array of length:', length);
    
    for (let i = 0; i < length; i++) {
      const key = readValue();
      const value = readValue();
      result[key] = value;
      console.log(`Array entry ${i}:`, { key, value });
    }
    
    position += 1; // Skip }
    return result;
  }

  function readValue(): any {
    const type = input[position];
    position += 2; // Skip type and :
    console.log('Reading value of type:', type);
    
    switch (type) {
      case 'i':
        const num = parseInt(input.slice(position, input.indexOf(';', position)));
        position = input.indexOf(';', position) + 1;
        console.log('Read integer:', num);
        return num;
      case 's':
        return readString();
      case 'a':
        return readArray();
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  }

  const result = readValue();
  console.log('Final unserialized result:', result);
  return result;
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
      return firstItem.toString();
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

function parsePlatformLinks(serializedLinks: string): PlatformLink[] {
  console.log('Starting platform links parsing with input:', serializedLinks);
  
  try {
    // Clean up the input string
    const cleanedStr = serializedLinks
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .trim();
    console.log('Cleaned serialized string:', cleanedStr);

    // Parse the PHP serialized data
    const unserialized = unserializePhp(cleanedStr);
    console.log('Unserialized platform links data:', JSON.stringify(unserialized, null, 2));

    const platformMapping: Record<string, string> = {
      'spotify': 'spotify',
      'apple': 'appleMusic',
      'apple_music': 'appleMusic',
      'amazon': 'amazonMusic',
      'amazon_music': 'amazonMusic',
      'youtube_music': 'youtubeMusic',
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

    const links: PlatformLink[] = [];
    
    // Handle array of platform links
    Object.entries(unserialized).forEach(([key, platform]: [string, any]) => {
      console.log('Processing platform entry:', { key, platform });
      
      if (platform && typeof platform === 'object') {
        const type = platform.type?.toLowerCase();
        const url = platform.url;
        
        console.log('Platform details:', { type, url });
        
        if (type && url && url.trim() !== '') {
          const platformId = platformMapping[type];
          if (platformId) {
            links.push({
              platform_id: platformId,
              platform_name: platformDisplayNames[platformId],
              url: url.trim()
            });
            console.log(`Added platform link: ${platformId} -> ${url}`);
          } else {
            console.log(`Unknown platform type: ${type}`);
          }
        }
      }
    });

    console.log('Final parsed platform links:', links);
    return links;
  } catch (error) {
    console.error('Error parsing platform links:', error);
    console.error('Original input:', serializedLinks);
    return [];
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
        const { data: userData, error: userError } = await supabase
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
        let viewCount = 0;
        let clickCount = 0;
        let platformLinksData = null;

        for (const meta of metas) {
          const key = extractCDATAContent(meta['wp:meta_key']);
          const value = extractCDATAContent(meta['wp:meta_value']);
          console.log('Processing meta:', { key, value });

          if (key === '_links' && value) {
            platformLinksData = value;
            console.log('Found platform links data:', platformLinksData);
          } else if (key === '_artist_name' && value) {
            artistName = value;
          } else if (key === '_default_image' && value) {
            artworkUrl = value;
          } else if (key === '_link_views' && value) {
            viewCount = parseInt(value) || 0;
          } else if (key === '_link_clicks' && value) {
            clickCount = parseInt(value) || 0;
          }
        }

        const { data: smartLink, error: insertError } = await supabase
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

        if (viewCount > 0) {
          const { error: viewError } = await supabase
            .from('link_views')
            .insert({
              smart_link_id: smartLink.id,
              viewed_at: new Date().toISOString(),
              user_agent: 'Imported from WordPress',
            });

          if (viewError) {
            console.error('Error recording historical views:', viewError);
          }
        }

        if (platformLinksData) {
          console.log('Processing platform links data:', platformLinksData);
          const platformLinks = parsePlatformLinks(platformLinksData);
          console.log('Parsed platform links:', platformLinks);

          if (platformLinks.length > 0) {
            const { data: insertedPlatformLinks, error: platformError } = await supabase
              .from('platform_links')
              .insert(
                platformLinks.map(pl => ({
                  smart_link_id: smartLink.id,
                  platform_id: pl.platform_id,
                  platform_name: pl.platform_name,
                  url: pl.url
                }))
              )
              .select();

            if (platformError) {
              throw new Error(`Failed to insert platform links: ${platformError.message}`);
            }

            if (clickCount > 0 && insertedPlatformLinks && insertedPlatformLinks.length > 0) {
              const { error: clickError } = await supabase
                .from('platform_clicks')
                .insert({
                  platform_link_id: insertedPlatformLinks[0].id,
                  clicked_at: new Date().toISOString(),
                  user_agent: 'Imported from WordPress',
                });

              if (clickError) {
                console.error('Error recording historical clicks:', clickError);
              }
            }
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