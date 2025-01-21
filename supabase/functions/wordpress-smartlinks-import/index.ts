import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

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

    // Wrap items in a root element
    const wrappedXml = `<?xml version="1.0" encoding="UTF-8"?><root>${fileContent}</root>`;
    console.log("XML wrapped with root element");

    const parser = new DOMParser();
    const doc = parser.parseFromString(wrappedXml, "text/xml");
    if (!doc) {
      throw new Error("Failed to parse XML document");
    }

    const items = doc.getElementsByTagName("item");
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
        const title = item.querySelector("title")?.textContent?.replace("<![CDATA[", "").replace("]]>", "") || "";
        const userEmail = item.querySelector("dc\\:creator")?.textContent?.replace("<![CDATA[", "").replace("]]>", "") || "";
        const slug = item.querySelector("wp\\:post_name")?.textContent?.replace("<![CDATA[", "").replace("]]>", "") || "";
        
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

        // Extract metadata
        const metaElements = item.getElementsByTagName("wp:postmeta");
        let artistName = "", artworkUrl = "", spotifyUrl = "", linksData = "";
        
        for (const meta of metaElements) {
          const key = meta.querySelector("wp\\:meta_key")?.textContent?.replace("<![CDATA[", "").replace("]]>", "");
          const value = meta.querySelector("wp\\:meta_value")?.textContent?.replace("<![CDATA[", "").replace("]]>", "");
          
          if (key === "_artist_name") artistName = value || "";
          if (key === "_default_image") artworkUrl = value || "";
          if (key === "_url") spotifyUrl = value || "";
          if (key === "_links") linksData = value || "";
        }

        // Parse PHP serialized links
        const linksMatch = linksData.match(/a:9:\{(.*?)\}/);
        const platformLinks: Record<string, string> = {};
        
        if (linksMatch) {
          const linksPairs = linksMatch[1].match(/s:\d+:"([^"]+)";s:\d+:"([^"]+)";/g);
          if (linksPairs) {
            for (const pair of linksPairs) {
              const [key, value] = pair.match(/s:\d+:"([^"]+)";/g)?.map(s => 
                s.replace(/s:\d+:"/, '').replace('";', '')
              ) || [];
              if (key && value) platformLinks[key] = value;
            }
          }
        }

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
          link: item.querySelector("title")?.textContent || "Unknown",
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