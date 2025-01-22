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

    const items = xmlDoc.rss.channel.item || [];
    console.log(`Found ${items.length} items in XML`);

    if (testMode) {
      items.length = Math.min(items.length, 10);
    }

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
        if (!item['wp:post_type'] || item['wp:post_type'][0] !== 'custom_links') {
          console.log('Skipping non-custom_links item');
          continue;
        }

        const title = item.title?.[0] || '';
        console.log(`Processing custom link: ${title}`);

        const creatorEmail = item['dc:creator']?.[0];
        console.log(`Found creator email: ${creatorEmail}`);

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

        console.log(`Found matching user: ${userData.id}`);

        const metas = item['wp:postmeta'] || [];
        console.log(`Found ${metas.length} meta fields`);

        const platformLinks: PlatformLink[] = [];
        let artistName = '';
        let artworkUrl = '';

        for (const meta of metas) {
          const key = meta['wp:meta_key']?.[0];
          const value = meta['wp:meta_value']?.[0];

          if (key === '_links' && value) {
            try {
              console.log('Processing links meta value');
              const cleanedStr = value.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
              const matches = cleanedStr.match(/s:\d+:"([^"]+)"\s*s:\d+:"([^"]+)"/g) || [];
              
              matches.forEach(match => {
                const [platform, url] = match.match(/:"([^"]+)"/g)?.map(s => s.slice(2, -1)) || [];
                if (platform && url && url.trim() !== '') {
                  const mappedPlatformId = platformMapping[platform];
                  if (mappedPlatformId) {
                    console.log(`Found platform link: ${platform} -> ${url}`);
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
            console.log(`Found artist name: ${artistName}`);
          } else if (key === '_default_image' && value) {
            artworkUrl = value;
            console.log(`Found artwork URL: ${artworkUrl}`);
          }
        }

        console.log('Creating smart link with platform links:', platformLinks);

        const { data: smartLink, error: insertError } = await supabase
          .from('smart_links')
          .insert({
            user_id: userData.id,
            title,
            artist_name: artistName || 'Unknown Artist',
            artwork_url: artworkUrl || null
          })
          .select()
          .single();

        if (insertError || !smartLink) {
          throw new Error(`Failed to insert smart link: ${insertError?.message}`);
        }

        if (platformLinks.length > 0) {
          const { error: platformError } = await supabase
            .from('platform_links')
            .insert(
              platformLinks.map(pl => ({
                smart_link_id: smartLink.id,
                platform_id: pl.platform_id,
                platform_name: pl.platform_name,
                url: pl.url
              }))
            );

          if (platformError) {
            throw new Error(`Failed to insert platform links: ${platformError.message}`);
          }
        }

        results.success++;
        console.log(`Successfully processed item: ${title}`);

      } catch (error) {
        console.error('Error processing item:', error);
        results.errors.push({
          link: item.title?.[0] || 'Unknown',
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