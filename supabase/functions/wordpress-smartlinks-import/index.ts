import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { XMLParser } from 'npm:fast-xml-parser'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ImportSummary {
  total: number;
  success: number;
  errors: { link: string; error: string }[];
  unassigned: string[];
}

function parseSerializedPHPString(serialized: string): Record<string, string> {
  const links: Record<string, string> = {};
  
  const match = serialized.match(/a:\d+:\{(.*?)\}/);
  if (!match) return links;
  
  const pairs = match[1].match(/s:\d+:"([^"]+)";s:\d+:"([^"]+)";/g);
  if (!pairs) return links;
  
  pairs.forEach(pair => {
    const [key, value] = pair.match(/s:\d+:"([^"]+)";/g)?.map(s => 
      s.replace(/s:\d+:"/, '').replace('";', '')
    ) || [];
    if (key && value) links[key] = value;
  });
  
  return links;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
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

    console.log("XML parsed successfully");

    const items = Array.isArray(result.rss.channel.item) 
      ? result.rss.channel.item 
      : [result.rss.channel.item];

    console.log(`Found ${items.length} items to process`);

    const itemsToProcess = items.slice(0, 10);
    console.log(`Processing first ${itemsToProcess.length} items for testing`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const summary: ImportSummary = {
      total: itemsToProcess.length,
      success: 0,
      errors: [],
      unassigned: [],
    };

    // Platform mappings using snake_case for consistency with frontend
    const platformMappings = {
      spotify: { id: 'spotify', name: 'Spotify' },
      appleMusic: { id: 'apple_music', name: 'Apple Music' },
      amazonMusic: { id: 'amazon_music', name: 'Amazon Music' },
      youtubeMusic: { id: 'youtube_music', name: 'YouTube Music' },
      deezer: { id: 'deezer', name: 'Deezer' },
      soundcloud: { id: 'soundcloud', name: 'SoundCloud' },
      youtube: { id: 'youtube', name: 'YouTube' },
      itunes: { id: 'itunes', name: 'iTunes Store' },
    };

    for (const item of itemsToProcess) {
      try {
        if (item["wp:post_type"] !== "custom_links") {
          console.log(`Skipping non-custom_links post type: ${item["wp:post_type"]}`);
          continue;
        }

        const title = item.title;
        const userEmail = item["dc:creator"];
        const slug = item["wp:post_name"];
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', userEmail)
          .single();

        if (profileError || !profileData) {
          console.log(`Profile not found for email: ${userEmail}`);
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
        const spotifyUrl = getMeta("_url") || "";
        const linksData = getMeta("_links") || "";

        const platformLinks = parseSerializedPHPString(linksData);
        console.log("Parsed platform links:", platformLinks);

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

        if (smartLinkError) {
          console.error(`Error creating smart link for ${title}:`, smartLinkError);
          throw smartLinkError;
        }

        console.log(`Created smart link with ID ${smartLink.id} for ${title}`);

        // Create platform links with proper error handling
        for (const [platform, url] of Object.entries(platformLinks)) {
          if (!url) continue;

          const mapping = platformMappings[platform as keyof typeof platformMappings];
          if (!mapping) {
            console.warn(`Unknown platform ${platform} for ${title}`);
            continue;
          }

          try {
            const { error: platformLinkError } = await supabase
              .from('platform_links')
              .insert({
                smart_link_id: smartLink.id,
                platform_id: mapping.id,
                platform_name: mapping.name,
                url,
              });

            if (platformLinkError) {
              console.error(`Error creating platform link for ${platform} in ${title}:`, platformLinkError);
            } else {
              console.log(`Created platform link for ${platform} in ${title}`);
            }
          } catch (error) {
            console.error(`Failed to create platform link for ${platform} in ${title}:`, error);
          }
        }

        summary.success++;
        console.log(`Successfully imported: ${title}`);
      } catch (error) {
        console.error(`Error processing item:`, error);
        summary.errors.push({
          link: item.title || "Unknown",
          error: error.message,
        });
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
    )

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
    )
  }
})