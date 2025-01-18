import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parse } from "https://deno.land/x/xml@2.1.1/mod.ts";

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
    let xmlDoc;
    
    try {
      xmlDoc = parse(text);
      console.log('XML Structure:', JSON.stringify(xmlDoc, null, 2));
      
      if (!xmlDoc.rss?.channel) {
        throw new Error('Invalid WordPress export file structure');
      }
    } catch (parseError) {
      console.error('XML parsing error:', parseError);
      throw new Error('Failed to parse WordPress export file. Please ensure it is a valid WordPress export XML.');
    }

    console.log('Successfully parsed WordPress XML file');

    // Initialize arrays to store parsed data
    const posts = [];
    const mediaItems = [];
    const missingMedia = new Set();
    const errors = [];

    // Parse channel information
    const channel = xmlDoc.rss.channel;
    const items = Array.isArray(channel.item) ? channel.item : [channel.item].filter(Boolean);
    
    console.log(`Found ${items.length} items in the XML file`);

    let processedItems = 0;
    const totalItems = items.length;

    for (const item of items) {
      try {
        processedItems++;
        console.log(`Processing item ${processedItems} of ${totalItems}:`, JSON.stringify(item, null, 2));
        
        const postType = item['wp:post_type']?.[0];
        console.log('Post type:', postType);
        
        if (postType === 'attachment') {
          const url = item['wp:attachment_url']?.[0];
          if (url) {
            const id = item['wp:post_id']?.[0] || crypto.randomUUID();
            const title = item.title?.[0];
            const description = item['content:encoded']?.[0];
            const filename = url.split('/').pop();
            
            // Extract metadata
            const metadata = {
              alt: item['wp:postmeta']?.find(meta => 
                meta['wp:meta_key']?.[0] === '_wp_attachment_image_alt'
              )?.[0]?.['wp:meta_value']?.[0],
              caption: item['excerpt:encoded']?.[0],
            };
            
            mediaItems.push({
              id,
              url,
              filename,
              title,
              alt: metadata.alt,
              caption: metadata.caption,
              description,
            });
          }
        } else if (postType === 'post') {
          console.log('Processing post:', item.title?.[0]);
          
          let content = item['content:encoded']?.[0] || '';
          const postDate = item['wp:post_date']?.[0];
          const status = item['wp:status']?.[0];
          
          // Process images in content
          const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
          let match;
          while ((match = imgRegex.exec(content)) !== null) {
            const imgUrl = match[1];
            const filename = imgUrl.split('/').pop();
            if (filename) {
              missingMedia.add(imgUrl);
            }
          }

          // Process categories and tags
          const categories = (item.category || []).map(cat => ({
            domain: cat?.['@domain'],
            name: cat?.['#text']
          }));

          const featuredImage = item['wp:postmeta']?.find(
            meta => meta['wp:meta_key']?.[0] === '_thumbnail_id'
          )?.[0]?.['wp:meta_value']?.[0];

          posts.push({
            title: item.title?.[0],
            content,
            excerpt: item['excerpt:encoded']?.[0],
            status: status || 'draft',
            post_date: postDate,
            categories: categories.filter(cat => cat.domain === 'category').map(cat => cat.name),
            tags: categories.filter(cat => cat.domain === 'post_tag').map(cat => cat.name),
            featured_image: featuredImage,
            meta_description: item['wp:postmeta']?.find(
              meta => meta['wp:meta_key']?.[0] === '_yoast_wpseo_metadesc'
            )?.[0]?.['wp:meta_value']?.[0],
            focus_keyword: item['wp:postmeta']?.find(
              meta => meta['wp:meta_key']?.[0] === '_yoast_wpseo_focuskw'
            )?.[0]?.['wp:meta_value']?.[0],
          });
          
          console.log('Post processed successfully:', posts[posts.length - 1].title);
        }
      } catch (itemError) {
        console.error(`Error processing item ${processedItems}:`, itemError);
        errors.push({
          item: processedItems,
          error: itemError.message
        });
      }
    }

    console.log(`Successfully processed ${posts.length} posts and found ${mediaItems.length} media items`);
    if (errors.length > 0) {
      console.log(`Encountered ${errors.length} errors during processing`);
    }

    return new Response(
      JSON.stringify({
        posts,
        mediaItems,
        missingMedia: Array.from(missingMedia),
        errors: errors.length > 0 ? errors : undefined,
        stats: {
          totalItems,
          processedPosts: posts.length,
          processedMedia: mediaItems.length,
          errors: errors.length
        }
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
        details: error.message,
        stack: error.stack
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