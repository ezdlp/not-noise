import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parse } from "https://deno.land/x/xml@2.1.1/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SmartLink {
  title: string;
  creator: string;
  artistName: string;
  defaultImage: string;
  links: Record<string, string>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting smart links import process');
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      throw new Error('No file uploaded');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const text = await file.text();
    const xmlDoc = parse(text);
    console.log('XML parsing successful');

    if (!xmlDoc.rss?.channel?.item) {
      throw new Error('Invalid WordPress export file structure');
    }

    const items = Array.isArray(xmlDoc.rss.channel.item) 
      ? xmlDoc.rss.channel.item 
      : [xmlDoc.rss.channel.item];

    console.log(`Found ${items.length} items in XML file`);

    const errors: Array<{ link: string; error: string }> = [];
    const unassigned: string[] = [];
    let successCount = 0;

    for (const item of items) {
      try {
        const title = item.title?.[0] || '';
        const creator = item['dc:creator']?.[0] || '';
        console.log('Processing item:', { title, creator });
        
        if (!creator) {
          throw new Error('Missing creator email');
        }

        // Extract metadata
        const postMeta = Array.isArray(item['wp:postmeta']) ? item['wp:postmeta'] : [item['wp:postmeta']];
        const getMetaValue = (key: string) => {
          const meta = postMeta.find(m => m['wp:meta_key']?.[0] === key);
          return meta?.['wp:meta_value']?.[0] || '';
        };

        const artistName = getMetaValue('_artist_name');
        const defaultImage = getMetaValue('_default_image');
        const linksStr = getMetaValue('_links');
        const links = linksStr ? JSON.parse(linksStr) : {};

        console.log('Extracted metadata:', { artistName, defaultImage });

        // Look up user by email in profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', creator)
          .single();

        if (profileError || !profile) {
          console.log('User lookup failed:', { error: profileError, email: creator });
          throw new Error(`User not found for email: ${creator}`);
        }

        // Create smart link
        const { error: insertError } = await supabase
          .from('smart_links')
          .insert({
            user_id: profile.id,
            title: title,
            artist_name: artistName.trim(),
            artwork_url: defaultImage,
            slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          });

        if (insertError) {
          throw new Error(`Failed to create smart link: ${insertError.message}`);
        }

        // Get the created smart link to add platform links
        const { data: smartLink, error: fetchError } = await supabase
          .from('smart_links')
          .select('id')
          .eq('title', title)
          .eq('user_id', profile.id)
          .single();

        if (fetchError || !smartLink) {
          throw new Error('Failed to fetch created smart link');
        }

        // Add platform links
        const platformInserts = Object.entries(links).map(([platform, url]) => ({
          smart_link_id: smartLink.id,
          platform_id: platform,
          platform_name: platform,
          url: url as string
        })).filter(link => link.url);

        if (platformInserts.length > 0) {
          const { error: platformError } = await supabase
            .from('platform_links')
            .insert(platformInserts);

          if (platformError) {
            throw new Error(`Failed to create platform links: ${platformError.message}`);
          }
        }

        successCount++;
        console.log(`Successfully imported smart link: ${title}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log('Error processing item:', errorMessage);
        errors.push({
          link: item.title?.[0] || 'Unknown',
          error: errorMessage
        });
        unassigned.push(item.title?.[0] || 'Unknown');
      }
    }

    const summary = {
      total: items.length,
      success: successCount,
      errors,
      unassigned
    };

    console.log('Import summary:', summary);

    return new Response(
      JSON.stringify(summary),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.log('Error processing WordPress import:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process WordPress import',
        details: error instanceof Error ? error.message : 'Unknown error'
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