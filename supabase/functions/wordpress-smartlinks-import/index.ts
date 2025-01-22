import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { XMLParser } from 'npm:fast-xml-parser'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CHUNK_SIZE = 10;

interface ImportSummary {
  total: number;
  success: number;
  errors: { link: string; error: string }[];
  unassigned: string[];
}

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
  console.log('Parsing PHP string:', serialized);
  const links: Record<string, string> = {};
  
  try {
    // Extract the array length from a:7:{...}
    const arrayMatch = serialized.match(/a:(\d+):\{(.*)\}/);
    if (!arrayMatch) return links;
    
    const content = arrayMatch[2];
    // Split into key-value pairs
    const pairs = content.split(/(?<="}|")\s+(?=s:)/);
    
    for (const pair of pairs) {
      // Extract key and value using regex
      const keyMatch = pair.match(/s:\d+:"([^"]+)"/);
      const valueMatch = pair.match(/s:\d+:"([^"]*)"/g);
      
      if (keyMatch && valueMatch && valueMatch.length > 1) {
        const key = keyMatch[1];
        const value = valueMatch[1].replace(/^s:\d+:"/, '').replace(/"$/, '');
        if (key && value !== undefined) {
          links[key] = value;
        }
      }
    }
    
    console.log('Final parsed links:', links);
  } catch (error) {
    console.error('Error parsing PHP string:', error);
  }
  
  return links;
}

function validatePlatformLinks(links: Record<string, string>): boolean {
  if (!links || Object.keys(links).length === 0) {
    console.log('No platform links found');
    return false;
  }

  const hasValidLinks = Object.entries(links).some(([platform, url]) => {
    const isValid = url && url.length > 0 && 
                   (platformMappings[platform] || 
                    Object.values(platformMappings).some(m => m.id === platform));
    if (isValid) {
      console.log(`Found valid link for platform ${platform}: ${url}`);
    }
    return isValid;
  });

  console.log(`Platform links validation result: ${hasValidLinks}`);
  return hasValidLinks;
}

async function processItemChunk(
  items: any[], 
  supabase: any, 
  summary: ImportSummary
): Promise<void> {
  for (const item of items) {
    try {
      if (item["wp:post_type"] !== "custom_links") continue;

      const title = item.title;
      const userEmail = item["dc:creator"];
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userEmail)
        .single();

      if (profileError || !profileData) {
        summary.unassigned.push(`${title} (${userEmail})`);
        continue;
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

      // Process platform links in sequence to avoid overwhelming the database
      for (const [platform, url] of Object.entries(platformLinks)) {
        if (!url) continue;

        let mapping = platformMappings[platform];
        if (!mapping) {
          mapping = Object.values(platformMappings).find(m => m.id === platform);
        }

        if (!mapping) continue;

        const { error: platformLinkError } = await supabase
          .from('platform_links')
          .insert({
            smart_link_id: smartLink.id,
            platform_id: mapping.id,
            platform_name: mapping.name,
            url,
          });

        if (platformLinkError) {
          console.error(`Error creating platform link for ${platform}:`, platformLinkError);
        }
      }

      summary.success++;
    } catch (error) {
      console.error(`Error processing item:`, error);
      summary.errors.push({
        link: item.title || "Unknown",
        error: error.message,
      });
    }
    
    // Small delay between items to prevent overwhelming resources
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting smart links import process");
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      throw new Error('No file provided');
    }

    const fileContent = await file.text();
    console.log(`File content length: ${fileContent.length}`);

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

    const items = Array.isArray(result.rss.channel.item) 
      ? result.rss.channel.item 
      : [result.rss.channel.item];

    console.log(`Found ${items.length} items to process`);

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

    // Process items in chunks
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, Math.min(i + CHUNK_SIZE, items.length));
      await processItemChunk(chunk, supabase, summary);
      
      // Add a delay between chunks
      if (i + CHUNK_SIZE < items.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
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
