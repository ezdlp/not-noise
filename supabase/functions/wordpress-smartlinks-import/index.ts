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
  
  // Extract the serialized array content
  const match = serialized.match(/a:\d+:\{(.*?)\}/);
  if (!match) return links;
  
  // Split into key-value pairs
  const pairs = match[1].match(/s:\d+:"([^"]+)";s:\d+:"([^"]+)";/g);
  if (!pairs) return links;
  
  // Process each pair
  pairs.forEach(pair => {
    const [key, value] = pair.match(/s:\d+:"([^"]+)";/g)?.map(s => 
      s.replace(/s:\d+:"/, '').replace('";', '')
    ) || [];
    if (key && value) links[key] = value;
  });
  
  return links;
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Parse XML with fast-xml-parser
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

    for (const item of items) {
      try {
        if (item["wp:post_type"] !== "custom_links") {
          console.log(`Skipping non-custom_links post type: ${item["wp:post_type"]}`);
          continue;
        }

        const title = item.title;
        const userEmail = item["dc:creator"];
        const slug = item["wp:post_name"];
        
        // Find user by email
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', userEmail)
          .single();

        if (userError || !userData) {
          console.log(`User not found for email: ${userEmail}`);
          summary.unassigned.push(`${title} (${userEmail})`);
          continue;
        }

        // Extract metadata from postmeta array
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

        // Parse serialized PHP links data
        const platformLinks = parseSerializedPHPString(linksData);
        console.log("Parsed platform links:", platformLinks);

        // Create smart link
        const { data: smartLink, error: smartLinkError } = await supabase
          .from('smart_links')
          .insert({
            user_id: userData.id,
            title,
            artwork_url: artworkUrl,
            slug,
            artist_name: artistName,
          })
          .select()
          .single();

        if (smartLinkError) {
          throw smartLinkError;
        }

        // Create platform links
        const platformMappings = {
          spotify: { id: 'spotify', name: 'Spotify' },
          appleMusic: { id: 'appleMusic', name: 'Apple Music' },
          amazonMusic: { id: 'amazonMusic', name: 'Amazon Music' },
          deezer: { id: 'deezer', name: 'Deezer' },
          youtube: { id: 'youtube', name: 'YouTube' },
          youtubeMusic: { id: 'youtubeMusic', name: 'YouTube Music' },
          soundcloud: { id: 'soundcloud', name: 'SoundCloud' },
          itunes: { id: 'itunes', name: 'iTunes' },
        };

        for (const [platform, url] of Object.entries(platformLinks)) {
          if (url && platformMappings[platform as keyof typeof platformMappings]) {
            const mapping = platformMappings[platform as keyof typeof platformMappings];
            await supabase
              .from('platform_links')
              .insert({
                smart_link_id: smartLink.id,
                platform_id: mapping.id,
                platform_name: mapping.name,
                url,
              });
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