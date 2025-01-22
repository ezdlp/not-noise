import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { XMLParser } from 'npm:fast-xml-parser'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CHUNK_SIZE = 5;
const DELAY_BETWEEN_CHUNKS = 1000;
const TEST_MODE_LIMIT = 10;

const platformMappings: Record<string, { id: string; name: string }> = {
  spotify: { id: 'spotify', name: 'Spotify' },
  apple_music: { id: 'apple_music', name: 'Apple Music' },
  amazon_music: { id: 'amazon_music', name: 'Amazon Music' },
  youtube_music: { id: 'youtube_music', name: 'YouTube Music' },
  deezer: { id: 'deezer', name: 'Deezer' },
  soundcloud: { id: 'soundcloud', name: 'SoundCloud' },
  youtube: { id: 'youtube', name: 'YouTube' },
  itunes: { id: 'itunes', name: 'iTunes Store' },
  // WordPress specific mappings
  appleMusic: { id: 'apple_music', name: 'Apple Music' },
  amazonMusic: { id: 'amazon_music', name: 'Amazon Music' },
  youtubeMusic: { id: 'youtube_music', name: 'YouTube Music' },
};

function parseSerializedPHPString(serialized: string): Record<string, string> {
  const links: Record<string, string> = {};
  
  try {
    console.log('Parsing PHP string:', serialized);
    
    // Extract the array content between curly braces
    const match = serialized.match(/a:\d+:{(.*?)}/);
    if (!match) {
      console.error('No array content found in PHP string');
      return links;
    }

    const content = match[1];
    // Split into key-value pairs
    const pairs = content.split(/s:\d+:"[^"]*"/g).filter(Boolean);
    
    for (let i = 0; i < pairs.length; i += 2) {
      const keyMatch = pairs[i].match(/"([^"]*)"/);
      const valueMatch = pairs[i + 1]?.match(/"([^"]*)"/);
      
      if (keyMatch && valueMatch) {
        const [, key] = keyMatch;
        const [, value] = valueMatch;
        if (value && value.trim() !== '') {
          links[key] = value;
        }
      }
    }

    console.log('Parsed links:', links);
  } catch (error) {
    console.error('Error parsing PHP string:', error);
  }
  
  return links;
}

function validatePlatformLinks(links: Record<string, string>): boolean {
  if (!links || Object.keys(links).length === 0) {
    console.log('No links found in object');
    return false;
  }

  const validLinks = Object.entries(links).filter(([platform, url]) => {
    const isValidPlatform = platformMappings[platform] || 
                           Object.values(platformMappings).some(m => m.id === platform);
    const isValidUrl = url && url.length > 0 && (url.startsWith('http://') || url.startsWith('https://'));
    
    console.log(`Platform: ${platform}, URL: ${url}`);
    console.log(`Is valid platform: ${isValidPlatform}, Is valid URL: ${isValidUrl}`);
    
    return isValidPlatform && isValidUrl;
  });

  console.log(`Found ${validLinks.length} valid links`);
  return validLinks.length > 0;
}

async function processItem(
  item: any,
  supabase: any,
  summary: ImportSummary
): Promise<void> {
  try {
    if (item["wp:post_type"] !== "custom_links") return;

    const title = item.title;
    const userEmail = item["dc:creator"];
    
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (!profileData) {
      summary.unassigned.push(`${title} (${userEmail})`);
      return;
    }

    const postmeta = Array.isArray(item["wp:postmeta"]) 
      ? item["wp:postmeta"] 
      : [item["wp:postmeta"]];

    const getMeta = (key: string) => {
      const meta = postmeta.find(m => m["wp:meta_key"] === key);
      return meta ? meta["wp:meta_value"] : null;
    };

    const artistName = getMeta("_artist_name") || "";
    const artworkUrl = getMeta("_default_image") || "";
    const linksData = getMeta("_links") || "";
    const slug = item["wp:post_name"];

    const platformLinks = parseSerializedPHPString(linksData);
    
    if (!validatePlatformLinks(platformLinks)) {
      throw new Error("No valid platform links found");
    }

    const { data: smartLink, error: smartLinkError } = await supabase
      .from('smart_links')
      .insert({
        user_id: profileData.id,
        title,
        artwork_url: artworkUrl,
        slug,
        artist_name: artistName,
      })
      .select()
      .single();

    if (smartLinkError) throw smartLinkError;

    for (const [platform, url] of Object.entries(platformLinks)) {
      if (!url) continue;

      const mapping = platformMappings[platform] || 
                     Object.values(platformMappings).find(m => m.id === platform);

      if (!mapping) continue;

      await supabase
        .from('platform_links')
        .insert({
          smart_link_id: smartLink.id,
          platform_id: mapping.id,
          platform_name: mapping.name,
          url,
        });
    }

    summary.success++;
  } catch (error) {
    console.error(`Error processing item:`, error);
    summary.errors.push({
      link: item.title || "Unknown",
      error: error.message,
    });
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const isTestMode = formData.get('testMode') === 'true';
    
    if (!file) {
      throw new Error('No file provided');
    }

    console.log(`Starting import in ${isTestMode ? 'TEST' : 'PRODUCTION'} mode`);

    const fileContent = await file.text();
    const parser = new XMLParser({
      attributeNamePrefix: "@_",
      ignoreAttributes: false,
      parseAttributeValue: true,
      trimValues: true,
    });

    const result = parser.parse(fileContent);
    if (!result.rss?.channel?.item) {
      throw new Error("Invalid WordPress export file structure");
    }

    let items = Array.isArray(result.rss.channel.item) 
      ? result.rss.channel.item 
      : [result.rss.channel.item];

    if (isTestMode) {
      console.log(`Test mode: limiting to ${TEST_MODE_LIMIT} items`);
      items = items.slice(0, TEST_MODE_LIMIT);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const summary: ImportSummary = {
      total: items.length,
      success: 0,
      errors: [],
      unassigned: [],
    };

    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      console.log(`Processing chunk ${Math.floor(i / CHUNK_SIZE) + 1} of ${Math.ceil(items.length / CHUNK_SIZE)}`);
      
      for (const item of chunk) {
        await processItem(item, supabase, summary);
      }
      
      if (i + CHUNK_SIZE < items.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CHUNKS));
      }
    }

    return new Response(
      JSON.stringify(summary),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );

  } catch (error) {
    console.error("Error processing WordPress import:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});
