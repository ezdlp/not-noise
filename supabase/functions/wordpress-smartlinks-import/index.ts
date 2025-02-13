
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
  item: Element,
  supabaseAdmin: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const title = item.querySelector('title')?.textContent || '';
    console.log(`Processing link: ${title}`);

    const creatorEmail = item.querySelector('dc\\:creator')?.textContent;
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

    const metas = Array.from(item.querySelectorAll('wp\\:postmeta') || []);
    let artistName = '';
    let artworkUrl = '';
    let platformLinksData = null;
    let metaPixelId = null;
    let metaPixelEnabled = false;
    let totalViews = 0;
    let totalClicks = 0;

    for (const meta of metas) {
      const key = meta.querySelector('wp\\:meta_key')?.textContent;
      const value = meta.querySelector('wp\\:meta_value')?.textContent;
      
      if (key === '_links' && value) {
        platformLinksData = value;
      } else if (key === '_artist_name' && value) {
        artistName = value;
      } else if (key === '_default_image' && value) {
        artworkUrl = value;
      } else if (key === '_fb_pixel' && value === '1') {
        metaPixelEnabled = true;
      } else if (key === '_fb_pixel_id' && value) {
        metaPixelId = value;
      } else if (key === '_link_views' && value) {
        totalViews = parseInt(value, 10) || 0;
      } else if (key === '_link_clicks' && value) {
        totalClicks = parseInt(value, 10) || 0;
      }
    }

    const { data: smartLink, error: insertError } = await supabaseAdmin
      .from('smart_links')
      .insert({
        user_id: userData.id,
        title,
        artist_name: artistName || 'Unknown Artist',
        artwork_url: artworkUrl || null,
        slug: item.querySelector('wp\\:post_name')?.textContent || undefined,
        meta_pixel_id: metaPixelEnabled ? metaPixelId : null,
        wp_total_views: totalViews,
        wp_total_clicks: totalClicks
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
    console.log('[Import] Starting WordPress import process');
    const formData = await req.formData();
    const file = formData.get('file');
    const testMode = formData.get('testMode') === 'true';
    
    if (!file || !(file instanceof File)) {
      console.error('[Import] No file uploaded');
      throw new Error('No file uploaded');
    }

    console.log('[Import] File received:', file.name, 'Size:', file.size);

    // Read file content
    const text = await file.text();
    if (!text || text.length === 0) {
      console.error('[Import] Empty file content');
      throw new Error('Empty file content');
    }

    console.log('[Import] File content length:', text.length);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results = {
      total: 0,
      success: 0,
      errors: [] as { link: string; error: string }[],
      unassigned: [] as string[]
    };

    // Parse XML as HTML since text/xml is not supported
    const parser = new DOMParser();
    console.log('[Import] Attempting to parse XML content');
    const xmlDoc = parser.parseFromString(text, "text/html");
    
    if (!xmlDoc) {
      console.error('[Import] Failed to parse XML document');
      throw new Error('Failed to parse XML document');
    }

    console.log('[Import] XML parsed successfully');
    
    const items = Array.from(xmlDoc.querySelectorAll('item')).filter(item => {
      const postType = item.querySelector('wp\\:post_type');
      console.log('[Import] Found item with post type:', postType?.textContent);
      return postType?.textContent === 'custom_links';  // FIXED: Changed from 'smart-link' to 'custom_links'
    });

    console.log(`[Import] Found ${items.length} smart link items`);

    if (items.length === 0) {
      console.warn('[Import] No smart link items found in XML');
      return new Response(
        JSON.stringify(results),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const itemsToProcess = testMode ? items.slice(0, 10) : items;
    console.log(`[Import] Processing ${itemsToProcess.length} items (test mode: ${testMode})`);

    for (const item of itemsToProcess) {
      results.total++;
      const title = item.querySelector('title')?.textContent || 'Untitled';
      console.log(`[Import] Processing item: ${title}`);
      
      try {
        const result = await processItem(item, supabaseAdmin);
        
        if (result.success) {
          results.success++;
          console.log(`[Import] Successfully processed: ${title}`);
        } else if (result.error === 'No matching user found' || result.error === 'No creator email found') {
          results.unassigned.push(title);
          console.log(`[Import] Unassigned: ${title} - ${result.error}`);
        } else {
          results.errors.push({ link: title, error: result.error || 'Unknown error' });
          console.log(`[Import] Error processing: ${title} - ${result.error}`);
        }
      } catch (error) {
        console.error('[Import] Error processing item:', error);
        results.errors.push({ link: title, error: error.message });
      }
    }

    console.log('[Import] Import completed:', results);

    return new Response(
      JSON.stringify(results),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('[Import] Error processing WordPress import:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process WordPress import', 
        details: error.message,
        stack: error.stack,
        type: error.constructor.name
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
