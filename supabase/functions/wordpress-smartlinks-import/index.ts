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
  const serializedStr = input.replace(/^s:\d+:"(.*?)";$/, '$1');
  
  function parseValue(): any {
    if (serializedStr.startsWith('a:')) {
      const match = serializedStr.match(/^a:(\d+):\{(.*)\}$/);
      if (!match) return null;
      
      const [, count, content] = match;
      const result: Record<string, any> = {};
      let currentContent = content;
      
      for (let i = 0; i < parseInt(count); i++) {
        const keyMatch = currentContent.match(/^s:\d+:"([^"]+)";/);
        if (!keyMatch) break;
        
        const key = keyMatch[1];
        currentContent = currentContent.slice(keyMatch[0].length);
        
        let valueMatch;
        if (currentContent.startsWith('s:')) {
          valueMatch = currentContent.match(/^s:\d+:"([^"]+)";/);
          if (!valueMatch) break;
          result[key] = valueMatch[1];
          currentContent = currentContent.slice(valueMatch[0].length);
        }
      }
      
      return result;
    }
    return null;
  }

  return parseValue();
}

function extractCDATAContent(value: any): string {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value) && value.length > 0) {
    const content = value[0];
    // Handle CDATA sections which might be nested in arrays
    if (typeof content === 'object' && content['#cdata'] !== undefined) {
      return content['#cdata'];
    }
    return content;
  }
  if (typeof value === 'object' && value['#cdata'] !== undefined) {
    return value['#cdata'];
  }
  return '';
}

function parsePlatformLinks(serializedLinks: string): PlatformLink[] {
  console.log('Parsing platform links from:', serializedLinks);
  
  try {
    const unserialized = unserializePhp(serializedLinks);
    console.log('Unserialized data:', unserialized);
    
    if (!unserialized) {
      console.log('Failed to unserialize platform links');
      return [];
    }

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
    
    Object.entries(unserialized).forEach(([key, value]: [string, any]) => {
      if (value && value.type && value.url) {
        const platformId = platformMapping[value.type.toLowerCase()];
        if (platformId) {
          links.push({
            platform_id: platformId,
            platform_name: platformDisplayNames[platformId],
            url: value.url
          });
          console.log(`Added platform link: ${platformId} -> ${value.url}`);
        } else {
          console.log(`Unknown platform type: ${value.type}`);
        }
      }
    });

    return links;
  } catch (error) {
    console.error('Error parsing platform links:', error);
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

    const platformMapping: Record<string, string> = {
      'spotify': 'spotify',
      'apple_music': 'appleMusic',
      'amazon_music': 'amazonMusic',
      'youtube_music': 'youtubeMusic',
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

    const platformDisplayNames: Record<string, string> = {
      'spotify': 'Spotify',
      'appleMusic': 'Apple Music',
      'amazonMusic': 'Amazon Music',
      'youtubeMusic': 'YouTube Music',
      'deezer': 'Deezer',
      'soundcloud': 'SoundCloud',
      'youtube': 'YouTube',
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
        const platformLinks: PlatformLink[] = [];
        let artistName = '';
        let artworkUrl = '';
        let viewCount = 0;
        let clickCount = 0;

        for (const meta of metas) {
          const key = extractCDATAContent(meta['wp:meta_key']);
          const value = extractCDATAContent(meta['wp:meta_value']);

          if (key === '_links' && value) {
            try {
              const cleanedStr = value.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
              const matches = cleanedStr.match(/s:\d+:"([^"]+)"\s*s:\d+:"([^"]+)"/g) || [];
              
              matches.forEach(match => {
                const [platform, url] = match.match(/:"([^"]+)"/g)?.map(s => s.slice(2, -1)) || [];
                if (platform && url && url.trim() !== '') {
                  const mappedPlatformId = platformMapping[platform];
                  if (mappedPlatformId) {
                    platformLinks.push({
                      platform_id: mappedPlatformId,
                      platform_name: platformDisplayNames[mappedPlatformId],
                      url: url.trim()
                    });
                  }
                }
              });
            } catch (error) {
              console.error('Error parsing platform links:', error);
            }
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
