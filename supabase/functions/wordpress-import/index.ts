import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parse } from "https://deno.land/x/xml@2.1.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CHUNK_SIZE = 50;

interface WordPressPost {
  title: string;
  content: string;
  excerpt?: string;
  post_date?: string;
  status?: string;
  categories?: string[];
  tags?: string[];
  featured_image?: string;
  meta_description?: string;
  focus_keyword?: string;
}

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  title?: string;
  alt?: string;
  caption?: string;
  description?: string;
}

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
      console.log('Attempting to parse XML file...');
      xmlDoc = parse(text);
      console.log('XML parsing successful');
      
      // Validate WordPress XML structure
      if (!xmlDoc.rss) {
        console.error('Missing RSS element in XML structure');
        throw new Error('Invalid WordPress export file - missing RSS element');
      }

      if (!xmlDoc.rss.channel) {
        console.error('Missing channel element in RSS structure');
        throw new Error('Invalid WordPress export file - missing channel element');
      }

      // Log full XML structure for debugging
      console.log('XML Structure:', JSON.stringify(xmlDoc, null, 2));

      // Log channel information
      console.log('Channel information:', {
        title: xmlDoc.rss.channel.title,
        link: xmlDoc.rss.channel.link,
        description: xmlDoc.rss.channel.description,
        'wp:wxr_version': xmlDoc.rss.channel['wp:wxr_version']?.[0],
      });
    } catch (parseError) {
      console.error('XML parsing error:', parseError);
      console.error('Raw file content:', text.substring(0, 1000) + '...'); // Log first 1000 chars
      throw new Error(`Failed to parse WordPress export file: ${parseError.message}`);
    }

    const posts: WordPressPost[] = [];
    const mediaItems: MediaItem[] = [];
    const missingMedia = new Set<string>();
    const errors: string[] = [];

    // Parse channel information
    const channel = xmlDoc.rss.channel;
    
    // Log raw items data for debugging
    console.log('Raw channel items:', JSON.stringify(channel.item, null, 2));
    
    // Ensure items exist and convert to array if single item
    const items = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];
    
    console.log(`Found ${items.length} items in the XML file`);

    if (items.length === 0) {
      console.error('No items found in the XML file');
      throw new Error('No items found in the WordPress export file');
    }

    // Process items in chunks
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      console.log(`Processing chunk ${Math.floor(i / CHUNK_SIZE) + 1} of ${Math.ceil(items.length / CHUNK_SIZE)}`);

      for (const item of chunk) {
        try {
          // Log raw item data for debugging
          console.log('Processing item:', JSON.stringify(item, null, 2));

          const postType = item['wp:post_type']?.[0];
          console.log('Post type:', postType);
          
          if (postType === 'attachment') {
            const url = item['wp:attachment_url']?.[0];
            if (url) {
              const id = item['wp:post_id']?.[0] || crypto.randomUUID();
              const title = item.title?.[0] || '';
              const description = item['content:encoded']?.[0] || '';
              const filename = url.split('/').pop();
              
              const metadata = {
                alt: item['wp:postmeta']?.find(meta => 
                  meta['wp:meta_key']?.[0] === '_wp_attachment_image_alt'
                )?.[0]?.['wp:meta_value']?.[0] || '',
                caption: item['excerpt:encoded']?.[0] || '',
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

              console.log('Added media item:', { id, filename });
            }
          } else if (postType === 'post') {
            const title = item.title?.[0] || '';
            const content = item['content:encoded']?.[0] || '';
            const excerpt = item['excerpt:encoded']?.[0] || '';
            const postDate = item['wp:post_date']?.[0];
            const status = item['wp:status']?.[0] || 'draft';
            
            // Process images in content
            const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
            let match;
            const contentStr = content.toString();
            while ((match = imgRegex.exec(contentStr)) !== null) {
              if (match[1]) missingMedia.add(match[1]);
            }

            // Process categories and tags
            const categories = Array.isArray(item.category) ? item.category : [item.category].filter(Boolean);
            const processedCategories = categories.map(cat => ({
              domain: cat?.['@domain'] || '',
              name: cat?.['#text'] || ''
            }));

            const featuredImage = item['wp:postmeta']?.find(
              meta => meta['wp:meta_key']?.[0] === '_thumbnail_id'
            )?.[0]?.['wp:meta_value']?.[0];

            posts.push({
              title,
              content,
              excerpt,
              status,
              post_date: postDate,
              categories: processedCategories.filter(cat => cat.domain === 'category').map(cat => cat.name),
              tags: processedCategories.filter(cat => cat.domain === 'post_tag').map(cat => cat.name),
              featured_image: featuredImage,
              meta_description: item['wp:postmeta']?.find(
                meta => meta['wp:meta_key']?.[0] === '_yoast_wpseo_metadesc'
              )?.[0]?.['wp:meta_value']?.[0],
              focus_keyword: item['wp:postmeta']?.find(
                meta => meta['wp:meta_key']?.[0] === '_yoast_wpseo_focuskw'
              )?.[0]?.['wp:meta_value']?.[0],
            });

            console.log(`Processed post: ${title}`);
          }
        } catch (itemError) {
          console.error('Error processing item:', itemError);
          errors.push(itemError.message);
        }

        // Free up memory after processing each item
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }

    console.log(`Successfully processed ${posts.length} posts and ${mediaItems.length} media items`);
    
    return new Response(
      JSON.stringify({
        posts,
        mediaItems,
        missingMedia: Array.from(missingMedia),
        errors: errors.length > 0 ? errors : undefined,
        stats: {
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
        stack: error.stack,
        type: error.constructor.name
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