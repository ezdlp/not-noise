import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parse } from "https://deno.land/x/xml@2.1.1/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    console.log("Starting import process...");
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      throw new Error('No file uploaded');
    }

    console.log(`File received: ${file.name}`);
    const text = await file.text();
    
    console.log("Parsing XML file...");
    const xmlDoc = parse(text);
    
    if (!xmlDoc.rss?.channel?.item) {
      throw new Error('Invalid WordPress export file structure');
    }

    const items = Array.isArray(xmlDoc.rss.channel.item) 
      ? xmlDoc.rss.channel.item 
      : [xmlDoc.rss.channel.item];

    const extractCData = (node: any): string => {
      if (!node) return '';
      if (Array.isArray(node)) return node[0];
      if (typeof node === 'string') return node;
      return '';
    };

    const validItems = [];
    
    for (const item of items) {
      const postType = extractCData(item['wp:post_type']);
      console.log("Raw post type value:", postType);
      console.log("Extracted post type:", postType);

      if (postType === 'custom_links') {
        const creator = extractCData(item['dc:creator']);
        console.log("Found creator email:", creator);

        // First try to find the user by email
        let userId = null;
        if (creator) {
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('email', creator)
            .maybeSingle();

          if (profile) {
            userId = profile.id;
            console.log("Found matching user:", userId);
          }
        }

        // If no user found, fallback to admin
        if (!userId) {
          const { data: adminUser } = await supabaseClient
            .from('user_roles')
            .select('user_id')
            .eq('role', 'admin')
            .limit(1)
            .single();
          
          if (!adminUser) {
            throw new Error('No admin user found');
          }
          
          userId = adminUser.user_id;
          console.log("Using admin user as fallback:", userId);
        }

        const title = extractCData(item.title);
        const content = extractCData(item['content:encoded']);
        const artistName = extractCData(item['wp:postmeta']?.find((meta: any) => 
          extractCData(meta['wp:meta_key']) === 'artist_name'
        )?.['wp:meta_value']) || 'Unknown Artist';

        const artworkUrl = extractCData(item['wp:postmeta']?.find((meta: any) => 
          extractCData(meta['wp:meta_key']) === 'artwork_url'
        )?.['wp:meta_value']);

        const platformLinks = [];
        const postMeta = Array.isArray(item['wp:postmeta']) ? item['wp:postmeta'] : [item['wp:postmeta']];
        
        for (const meta of postMeta) {
          const metaKey = extractCData(meta['wp:meta_key']);
          if (metaKey.startsWith('platform_')) {
            const platformId = metaKey.replace('platform_', '');
            const url = extractCData(meta['wp:meta_value']);
            if (url) {
              platformLinks.push({
                platform_id: platformId,
                platform_name: platformId.charAt(0).toUpperCase() + platformId.slice(1),
                url
              });
            }
          }
        }

        if (title && platformLinks.length > 0) {
          validItems.push({
            title,
            content,
            artist_name: artistName,
            artwork_url: artworkUrl,
            user_id: userId,
            platform_links: platformLinks
          });
        }
      }
    }

    if (validItems.length === 0) {
      throw new Error('No valid items found in the import file');
    }

    console.log(`Found ${validItems.length} valid items to import`);

    const importedItems = [];
    const errors = [];

    for (const item of validItems) {
      try {
        const { data: smartLink, error: smartLinkError } = await supabaseClient
          .from('smart_links')
          .insert({
            title: item.title,
            artist_name: item.artist_name,
            artwork_url: item.artwork_url,
            user_id: item.user_id
          })
          .select()
          .single();

        if (smartLinkError) throw smartLinkError;

        const platformLinksToInsert = item.platform_links.map(pl => ({
          ...pl,
          smart_link_id: smartLink.id
        }));

        const { error: platformLinksError } = await supabaseClient
          .from('platform_links')
          .insert(platformLinksToInsert);

        if (platformLinksError) throw platformLinksError;

        importedItems.push(smartLink);
      } catch (error) {
        console.error('Error importing item:', error);
        errors.push({
          title: item.title,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: importedItems.length,
        errors,
        total: validItems.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});