import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { parse } from "https://deno.land/x/xml@2.1.1/mod.ts";

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

interface PlatformLink {
  platform: string;
  url: string;
}

function logError(error: unknown, context?: string) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Error${context ? ` in ${context}` : ''}: ${errorMessage}`);
}

function validateAndWrapXML(xmlContent: string): string {
  if (xmlContent.includes('<rss')) {
    return xmlContent;
  }

  if (xmlContent.includes('<item>')) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:wfw="http://wellformedweb.org/CommentAPI/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:wp="http://wordpress.org/export/1.2/">
  <channel>
    ${xmlContent}
  </channel>
</rss>`;
  }

  throw new Error('Invalid WordPress export file - no items found');
}

function parsePlatformLinks(linksStr: string): PlatformLink[] {
  try {
    const urlMatches = linksStr.match(/https?:\/\/[^\s"';]+/g) || [];
    return urlMatches.map(url => {
      let platform = '';
      if (url.includes('spotify.com')) platform = 'spotify';
      else if (url.includes('music.apple.com')) platform = 'applemusic';
      else if (url.includes('deezer.com')) platform = 'deezer';
      else if (url.includes('music.amazon.com')) platform = 'amazonmusic';
      else if (url.includes('soundcloud.com')) platform = 'soundcloud';
      else if (url.includes('youtube.com') || url.includes('youtu.be')) platform = 'youtube';
      
      return { platform, url };
    }).filter(link => link.platform !== '');
  } catch (error) {
    logError(error, 'parsePlatformLinks');
    return [];
  }
}

async function processSmartLink(
  item: any,
  supabase: any,
  summary: ImportSummary
): Promise<void> {
  try {
    const title = item.title?.[0];
    
    // Extract and clean up the email from dc:creator
    const creatorRaw = item['dc:creator']?.[0];
    console.log('Raw creator value:', creatorRaw);
    
    // Handle both CDATA and plain text formats
    const creator = creatorRaw
      ?.replace(/<!\[CDATA\[|\]\]>/g, '')  // Remove CDATA wrapper if present
      ?.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ''); // Trim whitespace and special characters
    
    console.log('Processed creator email:', creator);

    if (!title || !creator) {
      throw new Error(`Missing required fields: ${!title ? 'title' : 'creator'}`);
    }

    console.log(`Processing smart link: "${title}" by ${creator}`);

    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', creator)
      .single();

    if (userError || !userData) {
      console.log('User not found for email:', creator);
      summary.unassigned.push(title);
      throw new Error(`User not found for email: ${creator}`);
    }

    const userId = userData.id;
    const postMeta = Array.isArray(item['wp:postmeta']) 
      ? item['wp:postmeta'] 
      : item['wp:postmeta'] 
      ? [item['wp:postmeta']] 
      : [];

    const metadata = new Map();
    for (const meta of postMeta) {
      const key = meta['wp:meta_key']?.[0];
      const value = meta['wp:meta_value']?.[0];
      if (key && value) {
        metadata.set(key, value);
      }
    }

    const spotifyUrl = metadata.get('_url');
    if (!spotifyUrl) {
      throw new Error('Missing Spotify URL');
    }

    const { data: smartLink, error: smartLinkError } = await supabase
      .from('smart_links')
      .insert({
        user_id: userId,
        title: title,
        artwork_url: metadata.get('_default_image'),
        artist_name: metadata.get('_artist_name') || '',
        email_capture_enabled: false,
      })
      .select()
      .single();

    if (smartLinkError || !smartLink) {
      throw new Error(`Failed to create smart link: ${smartLinkError?.message}`);
    }

    console.log('Smart link created:', smartLink.id);

    const linksStr = metadata.get('_links');
    if (linksStr) {
      const platformLinks = parsePlatformLinks(linksStr);
      
      for (const { platform, url } of platformLinks) {
        const { error: platformError } = await supabase
          .from('platform_links')
          .insert({
            smart_link_id: smartLink.id,
            platform_id: platform,
            platform_name: platform.charAt(0).toUpperCase() + platform.slice(1),
            url: url,
          });

        if (platformError) {
          console.error('Error adding platform link:', platformError);
        } else {
          console.log('Added platform link:', platform);
        }
      }
    }

    const views = parseInt(metadata.get('_link_views') || '0');
    const clicks = parseInt(metadata.get('_link_clicks') || '0');

    if (views > 0) {
      const viewPromises = Array(views).fill(null).map(() => 
        supabase.from('link_views').insert({
          smart_link_id: smartLink.id,
        })
      );
      await Promise.allSettled(viewPromises);
      console.log('Added', views, 'views');
    }

    if (clicks > 0) {
      const clickPromises = Array(clicks).fill(null).map(() => 
        supabase.from('platform_clicks').insert({
          platform_link_id: smartLink.id,
        })
      );
      await Promise.allSettled(clickPromises);
      console.log('Added', clicks, 'clicks');
    }
  } catch (error) {
    logError(error, 'processSmartLink');
    throw error;
  }
}

serve(async (req) => {
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

    console.log('File received:', file.name);
    const xmlContent = await file.text();
    console.log('XML content length:', xmlContent.length);

    // Validate and wrap XML content if needed
    const wrappedXML = validateAndWrapXML(xmlContent);
    console.log('XML structure validated and wrapped if needed');

    let xmlDoc;
    try {
      console.log('Parsing XML file...');
      xmlDoc = parse(wrappedXML);
      
      if (!xmlDoc.rss?.channel) {
        throw new Error('Invalid WordPress export file structure');
      }
      
      console.log('XML parsing successful');
    } catch (parseError) {
      logError(parseError, 'XML parsing');
      throw new Error(`Failed to parse WordPress export file: ${parseError.message}`);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const summary: ImportSummary = {
      total: 0,
      success: 0,
      errors: [],
      unassigned: [],
    };

    const channel = xmlDoc.rss.channel;
    const items = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];
    
    summary.total = items.length;
    console.log(`Found ${items.length} items in XML file`);

    if (items.length === 0) {
      throw new Error('No items found in WordPress export file');
    }

    for (const item of items) {
      try {
        await processSmartLink(item, supabase, summary);
        summary.success++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error processing item:', errorMessage);
        summary.errors.push({
          link: item.title?.[0] || 'Unknown',
          error: errorMessage,
        });
      }
    }

    console.log('Import summary:', summary);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logError(error, 'Fatal error');
    return new Response(
      JSON.stringify({ 
        error: 'Import process failed', 
        details: error instanceof Error ? error.message : String(error),
        summary: { total: 0, success: 0, errors: [], unassigned: [] }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});