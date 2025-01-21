import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

interface SmartLinkData {
  title: string;
  link: string;
  pubDate: string;
  creator: string;
  guid: {
    isPermaLink: boolean;
    value: string;
  };
  description: string;
  postId: number;
  postDate: string;
  postModified: string;
  postType: string;
  artistName: string;
  defaultImage: string;
  url: string;
  linkViews: number;
  linkClicks: number;
  links: Record<string, string>;
}

function logError(error: unknown, context?: string) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Error${context ? ` in ${context}` : ''}: ${errorMessage}`);
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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

function extractSmartLinkData(item: any): SmartLinkData {
  // Extract title with proper CDATA handling
  let title = '';
  if (item.title) {
    const rawTitle = Array.isArray(item.title) ? item.title[0] : item.title;
    title = typeof rawTitle === 'string' 
      ? rawTitle.replace(/<!\[CDATA\[|\]\]>/g, '').trim()
      : rawTitle?.['#text'] || '';
  }
  console.log('Raw title value:', item.title);
  console.log('Processed title:', title);

  // Extract link with proper handling
  const link = Array.isArray(item.link) ? item.link[0] : '';
  const pubDate = Array.isArray(item.pubDate) ? item.pubDate[0] : '';
  
  // Properly extract creator from CDATA section
  let creator = '';
  if (item['dc:creator']) {
    const rawCreator = Array.isArray(item['dc:creator']) ? item['dc:creator'][0] : item['dc:creator'];
    creator = typeof rawCreator === 'string' 
      ? rawCreator.replace(/<!\[CDATA\[|\]\]>/g, '').trim()
      : rawCreator?.['#text'] || '';
  }
  console.log('Raw creator value:', item['dc:creator']);
  console.log('Processed creator:', creator);

  // Extract description
  const description = Array.isArray(item.description) ? item.description[0] : '';
  
  // Extract GUID with proper handling of attributes
  const guidElement = item.guid?.[0];
  const guid = {
    isPermaLink: guidElement?.['@isPermaLink'] === 'true',
    value: typeof guidElement === 'string' ? guidElement : guidElement?.['#text'] || ''
  };

  // Extract WordPress specific fields with proper array handling
  const postId = parseInt(Array.isArray(item['wp:post_id']) ? item['wp:post_id'][0] : '0');
  const postDate = Array.isArray(item['wp:post_date']) ? item['wp:post_date'][0] : '';
  const postModified = Array.isArray(item['wp:post_modified']) ? item['wp:post_modified'][0] : '';
  const postType = Array.isArray(item['wp:post_type']) ? item['wp:post_type'][0] : '';

  // Process postmeta elements with proper array handling
  const postMeta = Array.isArray(item['wp:postmeta']) ? item['wp:postmeta'] : [item['wp:postmeta']].filter(Boolean);
  const metadata = new Map();
  
  postMeta.forEach((meta: any) => {
    if (!meta) return;
    const key = Array.isArray(meta['wp:meta_key']) ? meta['wp:meta_key'][0] : '';
    const value = Array.isArray(meta['wp:meta_value']) ? meta['wp:meta_value'][0] : '';
    if (key && value) {
      metadata.set(key.replace(/<!\[CDATA\[|\]\]>/g, '').trim(), 
                   value.replace(/<!\[CDATA\[|\]\]>/g, '').trim());
    }
  });

  // Extract metadata values with proper null handling
  const artistName = metadata.get('_artist_name') || '';
  const defaultImage = metadata.get('_default_image') || '';
  const url = metadata.get('_url') || '';
  const linkViews = parseInt(metadata.get('_link_views') || '0');
  const linkClicks = parseInt(metadata.get('_link_clicks') || '0');

  // Parse links with proper error handling
  let links: Record<string, string> = {};
  try {
    const linksStr = metadata.get('_links');
    if (linksStr) {
      // Parse platform links from the serialized string
      const urlMatches = linksStr.match(/https?:\/\/[^\s"';]+/g) || [];
      urlMatches.forEach(url => {
        if (url.includes('spotify.com')) links.spotify = url;
        else if (url.includes('music.apple.com')) links.appleMusic = url;
        else if (url.includes('deezer.com')) links.deezer = url;
        else if (url.includes('music.amazon.com')) links.amazonMusic = url;
        else if (url.includes('soundcloud.com')) links.soundcloud = url;
        else if (url.includes('youtube.com') || url.includes('youtu.be')) {
          links.youtube = url;
          links.youtubeMusic = url;
        }
        else if (url.includes('tidal.com')) links.tidal = url;
      });
    }
  } catch (error) {
    console.error('Error parsing links:', error);
  }

  return {
    title,
    link,
    pubDate,
    creator,
    guid,
    description,
    postId,
    postDate,
    postModified,
    postType,
    artistName,
    defaultImage,
    url,
    linkViews,
    linkClicks,
    links
  };
}

async function processSmartLink(item: any, supabase: any, summary: ImportSummary): Promise<void> {
  try {
    const data = extractSmartLinkData(item);
    console.log('Extracted data:', JSON.stringify(data, null, 2));

    if (!data.title) {
      throw new Error('Missing title');
    }

    if (!data.creator) {
      throw new Error('Missing creator email');
    }

    if (!validateEmail(data.creator)) {
      console.error(`Invalid email format for item "${data.title}": ${data.creator}`);
      summary.unassigned.push(data.title);
      summary.errors.push({
        link: data.title,
        error: `Invalid email format: ${data.creator}`
      });
      return;
    }

    // Query for user profile using the validated email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', data.creator)
      .maybeSingle();

    if (userError || !userData) {
      console.log('User lookup failed:', { error: userError, email: data.creator });
      summary.unassigned.push(data.title);
      summary.errors.push({
        link: data.title,
        error: `User not found for email: ${data.creator}`
      });
      return;
    }

    const userId = userData.id;

    // Create smart link
    const { data: smartLink, error: smartLinkError } = await supabase
      .from('smart_links')
      .insert({
        user_id: userId,
        title: data.title,
        artwork_url: data.defaultImage,
        artist_name: data.artistName,
        email_capture_enabled: false,
      })
      .select()
      .single();

    if (smartLinkError || !smartLink) {
      throw new Error(`Failed to create smart link: ${smartLinkError?.message}`);
    }

    // Create platform links
    for (const [platform, url] of Object.entries(data.links)) {
      if (!url) continue;

      const { error: platformError } = await supabase
        .from('platform_links')
        .insert({
          smart_link_id: smartLink.id,
          platform_id: platform.toLowerCase(),
          platform_name: platform,
          url: url,
        });

      if (platformError) {
        console.error('Error adding platform link:', platformError);
      }
    }

    // Process views and clicks
    if (data.linkViews > 0) {
      const viewPromises = Array(data.linkViews).fill(null).map(() => 
        supabase.from('link_views').insert({
          smart_link_id: smartLink.id,
        })
      );
      await Promise.allSettled(viewPromises);
    }

    if (data.linkClicks > 0) {
      const clickPromises = Array(data.linkClicks).fill(null).map(() => 
        supabase.from('platform_clicks').insert({
          platform_link_id: smartLink.id,
        })
      );
      await Promise.allSettled(clickPromises);
    }

    summary.success++;
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

    const xmlContent = await file.text();
    const wrappedXML = validateAndWrapXML(xmlContent);
    
    let xmlDoc;
    try {
      console.log('Parsing XML file...');
      xmlDoc = parse(wrappedXML);
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
