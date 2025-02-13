import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
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

function unserializePhp(serializedString: string): Record<string, string> {
  console.log('Unserializing PHP string:', serializedString);
  
  try {
    // First, remove the outer string serialization wrapper
    const arrayContent = serializedString.match(/^s:\d+:"(.*?)";$/)?.[1];
    if (!arrayContent) {
      console.error('Invalid serialized format - no outer string wrapper');
      return {};
    }

    // Then, remove the array length indicator
    const arrayData = arrayContent.match(/^a:\d+:{(.+)}$/)?.[1];
    if (!arrayData) {
      console.error('Invalid serialized format - no array data');
      return {};
    }

    const result: Record<string, string> = {};
    const pairs = arrayData.match(/s:\d+:"([^"]+)";s:\d+:"([^"]*)";/g) || [];

    pairs.forEach(pair => {
      const keyMatch = pair.match(/s:\d+:"([^"]+)";/);
      const valueMatch = pair.match(/;s:\d+:"([^"]*)";/);
      
      if (keyMatch && valueMatch) {
        const key = keyMatch[1];
        const value = valueMatch[1];
        if (value) { // Only add non-empty values
          result[key] = value;
        }
      }
    });

    console.log('Unserialized result:', result);
    return result;
  } catch (error) {
    console.error('Error unserializing PHP string:', error);
    return {};
  }
}

function parsePlatformLinks(linksData: string | null): PlatformLink[] {
  if (!linksData) {
    console.log('No links data provided');
    return [];
  }
  
  console.log('Parsing platform links from:', linksData);
  
  try {
    const linksMap = unserializePhp(linksData);
    const links: PlatformLink[] = [];

    for (const [platformKey, url] of Object.entries(linksMap)) {
      const platformId = platformMapping[platformKey];
      if (platformId && url) {
        links.push({
          platform_id: platformId,
          platform_name: platformDisplayNames[platformId],
          url: url.trim()
        });
        console.log('Added platform link:', {
          platform_id: platformId,
          platform_name: platformDisplayNames[platformId],
          url: url.trim()
        });
      }
    }

    return links;
  } catch (error) {
    console.error('Error parsing platform links:', error);
    return [];
  }
}

function extractCData(element: Element | null, selector: string): string {
  if (!element) return '';
  
  const node = element.querySelector(selector);
  if (!node) return '';
  
  // Get text content, removing CDATA wrapper if present
  const content = node.textContent || '';
  return content.replace(/^\s*<!\[CDATA\[(.*)\]\]>\s*$/, '$1');
}

async function processItem(
  item: Element,
  supabaseAdmin: any
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[Import] Processing item...');
    const title = extractCData(item, 'title');
    console.log('[Import] Title:', title);

    const creatorEmail = extractCData(item, 'dc\\:creator');
    if (!creatorEmail) {
      console.log('[Import] No creator email found');
      return { success: false, error: 'No creator email found' };
    }
    console.log('[Import] Creator email:', creatorEmail);

    const { data: userData, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', creatorEmail)
      .single();

    if (userError || !userData) {
      console.log('[Import] No matching user found for email:', creatorEmail);
      return { success: false, error: 'No matching user found' };
    }

    const postType = extractCData(item, 'wp\\:post_type');
    if (postType !== 'custom_links') {
      console.log('[Import] Not a custom link:', postType);
      return { success: false, error: 'Not a custom link' };
    }

    let artistName = '';
    let artworkUrl = '';
    let platformLinksData = null;
    let metaPixelId = null;
    let metaPixelEnabled = false;
    let totalViews = 0;
    let totalClicks = 0;
    const slug = extractCData(item, 'wp\\:post_name');

    const metas = Array.from(item.querySelectorAll('wp\\:postmeta') || []);
    
    for (const meta of metas) {
      const key = extractCData(meta, 'wp\\:meta_key');
      const value = extractCData(meta, 'wp\\:meta_value');
      
      console.log('[Import] Processing meta:', { key, value });
      
      switch (key) {
        case '_links':
          platformLinksData = value;
          break;
        case '_artist_name':
          artistName = value;
          break;
        case '_default_image':
          artworkUrl = value;
          break;
        case '_fb_pixel':
          metaPixelEnabled = value === '1';
          break;
        case '_fb_pixel_id':
          metaPixelId = value;
          break;
        case '_link_views':
          totalViews = parseInt(value, 10) || 0;
          break;
        case '_link_clicks':
          totalClicks = parseInt(value, 10) || 0;
          break;
      }
    }

    console.log('[Import] Extracted metadata:', {
      artistName,
      artworkUrl,
      metaPixelEnabled,
      metaPixelId,
      totalViews,
      totalClicks,
      slug
    });

    const { data: smartLink, error: insertError } = await supabaseAdmin
      .from('smart_links')
      .insert({
        user_id: userData.id,
        title,
        artist_name: artistName || 'Unknown Artist',
        artwork_url: artworkUrl || null,
        slug: slug || undefined,
        meta_pixel_id: metaPixelEnabled ? metaPixelId : null,
        wp_total_views: totalViews,
        wp_total_clicks: totalClicks
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Import] Failed to insert smart link:', insertError);
      throw insertError;
    }

    if (!smartLink) {
      throw new Error('No smart link data returned after insert');
    }

    console.log('[Import] Created smart link:', smartLink.id);

    if (platformLinksData) {
      const platformLinks = parsePlatformLinks(platformLinksData);
      console.log('[Import] Parsed platform links:', platformLinks);

      if (platformLinks.length > 0) {
        const platformLinksWithId = platformLinks.map(pl => ({
          ...pl,
          smart_link_id: smartLink.id
        }));

        const { error: platformError } = await supabaseAdmin
          .from('platform_links')
          .insert(platformLinksWithId);

        if (platformError) {
          console.error('[Import] Failed to insert platform links:', platformError);
          throw platformError;
        }

        console.log('[Import] Inserted platform links successfully');
      }
    }

    return { success: true };
  } catch (error) {
    console.error('[Import] Error processing item:', error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[Import] Starting WordPress import process');
    
    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log('[Import] Request body parsed successfully');
    } catch (error) {
      console.error('[Import] Failed to parse request body:', error);
      throw new Error('Invalid request body format');
    }

    const { content, testMode } = body;
    
    if (!content) {
      console.error('[Import] No content provided in request');
      throw new Error('No content provided');
    }

    if (typeof content !== 'string') {
      console.error('[Import] Content must be a string');
      throw new Error('Content must be a string');
    }

    console.log('[Import] Content received, length:', content.length);

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse XML content
    console.log('[Import] Attempting to parse XML content');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, "text/xml");
    
    if (!xmlDoc) {
      console.error('[Import] Failed to parse XML document');
      throw new Error('Failed to parse XML document');
    }

    console.log('[Import] XML parsed successfully');

    const results = {
      total: 0,
      success: 0,
      errors: [] as { link: string; error: string }[],
      unassigned: [] as string[]
    };

    const items = Array.from(xmlDoc.querySelectorAll('item')).filter(item => {
      const postType = item.querySelector('wp\\:post_type');
      const typeName = postType?.textContent?.replace(/^\s*<!\[CDATA\[(.*)\]\]>\s*$/, '$1');
      console.log('[Import] Found item with post type:', typeName);
      return typeName === 'custom_links';
    });

    console.log(`[Import] Found ${items.length} custom_links items`);

    if (items.length === 0) {
      console.warn('[Import] No custom_links items found in XML');
      return new Response(
        JSON.stringify(results),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const itemsToProcess = testMode ? items.slice(0, 10) : items;
    console.log(`[Import] Processing ${itemsToProcess.length} items (test mode: ${testMode})`);

    for (const item of itemsToProcess) {
      results.total++;
      const title = extractCData(item, 'title');
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
