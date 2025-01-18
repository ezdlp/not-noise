import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parse } from "https://deno.land/x/xml@2.1.1/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting WordPress import process');
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      throw new Error('No file uploaded');
    }

    const text = await file.text();
    const xmlDoc = parse(text);
    
    if (!xmlDoc.rss) {
      throw new Error('Invalid WordPress export file format');
    }

    console.log('Successfully parsed WordPress XML file');

    // Initialize arrays to store parsed data
    const posts = [];
    const mediaItems = [];
    const missingMedia = new Set();

    // Parse channel information
    const channel = xmlDoc.rss.channel;
    if (!channel) throw new Error('Invalid WordPress export file structure');

    // Parse items (posts and media)
    const items = channel.item || [];
    console.log(`Found ${items.length} items in the XML file`);

    for (const item of items) {
      const postType = item['wp:post_type']?.[0];
      
      if (postType === 'attachment') {
        const url = item['wp:attachment_url']?.[0];
        if (url) {
          const id = item['wp:post_id']?.[0] || crypto.randomUUID();
          const title = item.title?.[0];
          const description = item.description?.[0];
          const filename = url.split('/').pop();
          
          // Extract alt text and other metadata from content
          const content = item['content:encoded']?.[0] || '';
          const altMatch = content.match(/alt="([^"]*)"/);
          const captionMatch = content.match(/caption="([^"]*)"/);
          
          mediaItems.push({
            id,
            url,
            filename,
            title,
            alt: altMatch?.[1],
            caption: captionMatch?.[1],
            description,
          });
        }
      } else if (postType === 'post') {
        let content = item['content:encoded']?.[0] || '';
        const postDate = item['wp:post_date']?.[0];
        const status = item['wp:status']?.[0];
        const author = item['dc:creator']?.[0];
        
        // Find all img tags and collect their sources
        const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
        let match;
        while ((match = imgRegex.exec(content)) !== null) {
          const imgUrl = match[1];
          const filename = imgUrl.split('/').pop();
          missingMedia.add(imgUrl);
        }

        // Parse categories and tags
        const categories = (item.category || []).map(cat => ({
          domain: cat?.['@domain'],
          name: cat?.['#text']
        }));

        posts.push({
          title: item.title?.[0],
          content,
          excerpt: item['excerpt:encoded']?.[0],
          status: status || 'draft',
          author,
          post_date: postDate,
          categories: categories.filter(cat => cat.domain === 'category').map(cat => cat.name),
          tags: categories.filter(cat => cat.domain === 'post_tag').map(cat => cat.name),
          featured_image: item['wp:attachment_url']?.[0]
        });
      }
    }

    console.log(`Processed ${posts.length} posts and found ${mediaItems.length} media items`);
    console.log(`Found ${missingMedia.size} missing media references`);

    return new Response(
      JSON.stringify({
        posts,
        mediaItems,
        missingMedia: Array.from(missingMedia)
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error processing WordPress import:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process WordPress import', 
        details: error.message 
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