
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
  try {
    const arrayMatch = serializedLinks.match(/^s:\d+:"(a:\d+:\{.*\})";$/);
    if (!arrayMatch) {
      throw new Error('Invalid serialized format');
    }

    const arrayContent = arrayMatch[1];
    const pairs = arrayContent.match(/s:\d+:"[^"]+";s:\d+:"[^"]*";/g) || [];
    const links: PlatformLink[] = [];

    for (const pair of pairs) {
      const keyMatch = pair.match(/s:\d+:"([^"]+)";/);
      const valueMatch = pair.match(/;s:\d+:"([^"]*)";/);

      if (!keyMatch || !valueMatch) {
        continue;
      }

      const platformKey = keyMatch[1];
      const url = valueMatch[1];

      if (!url) {
        continue;
      }

      const platformId = platformMapping[platformKey];
      if (!platformId) {
        continue;
      }

      links.push({
        platform_id: platformId,
        platform_name: platformDisplayNames[platformId],
        url: url.trim()
      });
    }

    return links;
  } catch (error) {
    console.error('Error parsing platform links:', error);
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

    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') as string,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    );

    // Log memory usage at start
    const startMemory = Deno.memoryUsage();
    console.log('Initial memory usage:', {
      heapUsed: startMemory.heapUsed / 1024 / 1024 + ' MB',
      heapTotal: startMemory.heapTotal / 1024 / 1024 + ' MB',
    });

    const text = await file.text();
    const xmlDoc = parse(text);

    if (!xmlDoc || !xmlDoc.rss || !xmlDoc.rss.channel) {
      throw new Error('Invalid XML file structure');
    }

    const items = xmlDoc.rss.channel.item || [];
    console.log(`Processing ${items.length} items`);

    const results = {
      total: items.length,
      success: 0,
      errors: [] as { link: string; error: string }[],
      unassigned: [] as string[],
      emailMatches: [] as { 
        email: string,
        found: boolean,
        title: string,
        matchAttempt: string 
      }[]
    };

    for (const item of items) {
      try {
        const title = extractCDATAContent(item.title) || '';
        const creatorEmail = extractCDATAContent(item['dc:creator']);
        
        if (!creatorEmail) {
          results.unassigned.push(title);
          continue;
        }

        const normalizedEmail = creatorEmail.trim().toLowerCase();
        
        // Get matching profile for the email
        const { data: matchingProfiles, error: userError } = await supabaseAdmin
          .from('profiles')
          .select('id, email')
          .ilike('email', normalizedEmail)
          .limit(1);

        if (userError) {
          throw new Error(`Database lookup error: ${userError.message}`);
        }

        if (!matchingProfiles || matchingProfiles.length === 0) {
          results.unassigned.push(title);
          results.emailMatches.push({
            email: normalizedEmail,
            found: false,
            title,
            matchAttempt: 'No matching profile found'
          });
          continue;
        }

        const userData = matchingProfiles[0];
        results.emailMatches.push({
          email: normalizedEmail,
          found: true,
          title,
          matchAttempt: `Matched to user ID: ${userData.id}`
        });

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

        results.success++;

      } catch (error) {
        results.errors.push({
          link: extractCDATAContent(item.title) || 'Unknown',
          error: error.message
        });
      }

      // Log memory usage every 10 items
      if (results.success % 10 === 0) {
        const currentMemory = Deno.memoryUsage();
        console.log('Current memory usage:', {
          heapUsed: currentMemory.heapUsed / 1024 / 1024 + ' MB',
          heapTotal: currentMemory.heapTotal / 1024 / 1024 + ' MB',
          processed: results.success,
          total: results.total
        });
      }
    }

    // Log final memory usage
    const endMemory = Deno.memoryUsage();
    console.log('Final memory usage:', {
      heapUsed: endMemory.heapUsed / 1024 / 1024 + ' MB',
      heapTotal: endMemory.heapTotal / 1024 / 1024 + ' MB',
    });

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

