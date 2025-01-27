import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parse } from "https://deno.land/x/xml@2.1.1/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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

interface MediaMapping {
  [wordpressUrl: string]: string;
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
      console.error('No file uploaded');
      throw new Error('No file uploaded');
    }

    console.log('File received:', file.name, 'Size:', file.size);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch existing media files
    const { data: existingMedia, error: mediaError } = await supabase
      .from('media_files')
      .select('filename, file_path');

    if (mediaError) {
      console.error('Error fetching media files:', mediaError);
      throw new Error('Failed to fetch media files');
    }

    console.log('Fetched existing media files:', existingMedia?.length || 0);

    // Create a mapping of filenames to file paths
    const mediaMapping: MediaMapping = {};
    existingMedia?.forEach(media => {
      const filename = media.filename.toLowerCase();
      const supabaseUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/media-library/${media.file_path}`;
      mediaMapping[filename] = supabaseUrl;
      
      const filenameWithoutExt = filename.split('.').slice(0, -1).join('.');
      const ext = filename.split('.').pop();
      if (ext) {
        mediaMapping[`${filenameWithoutExt}-\\d+x\\d+\\.${ext}`] = supabaseUrl;
        mediaMapping[`${filenameWithoutExt}-scaled\\.${ext}`] = supabaseUrl;
        mediaMapping[`${filenameWithoutExt}-thumbnail\\.${ext}`] = supabaseUrl;
      }
    });

    const text = await file.text();
    let xmlDoc;
    
    try {
      console.log('Parsing XML file...');
      xmlDoc = parse(text);
      console.log('XML structure:', Object.keys(xmlDoc));
      
      if (!xmlDoc.rss) {
        console.error('Missing RSS element in XML structure');
        throw new Error('Invalid WordPress export file - missing RSS element');
      }

      if (!xmlDoc.rss.channel) {
        console.error('Missing channel element in RSS structure');
        throw new Error('Invalid WordPress export file - missing channel element');
      }

      console.log('Channel information:', {
        title: xmlDoc.rss.channel.title,
        link: xmlDoc.rss.channel.link,
        description: xmlDoc.rss.channel.description,
        'wp:wxr_version': xmlDoc.rss.channel['wp:wxr_version']?.[0],
      });
    } catch (parseError) {
      console.error('XML parsing error:', parseError);
      console.error('Raw file content (first 1000 chars):', text.substring(0, 1000)); 
      throw new Error(`Failed to parse WordPress export file: ${parseError.message}`);
    }

    const posts: WordPressPost[] = [];
    const mediaItems: MediaItem[] = [];
    const missingMedia = new Set<string>();
    const errors: string[] = [];

    const channel = xmlDoc.rss.channel;
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
          console.log('Processing item:', {
            title: item.title?.[0],
            type: item['wp:post_type']?.[0],
            status: item['wp:status']?.[0],
          });

          const postType = item['wp:post_type']?.[0];
          if (!postType) {
            console.warn('Item missing post type:', item);
            continue;
          }
          
          if (postType === 'attachment') {
            const url = item['wp:attachment_url']?.[0];
            if (url) {
              const id = item['wp:post_id']?.[0] || crypto.randomUUID();
              const title = item.title?.[0] || '';
              const description = item['content:encoded']?.[0] || '';
              const filename = url.split('/').pop()?.toLowerCase() || '';
              
              const metadata = {
                alt: item['wp:postmeta']?.find(meta => 
                  meta['wp:meta_key']?.[0] === '_wp_attachment_image_alt'
                )?.[0]?.['wp:meta_value']?.[0] || '',
                caption: item['excerpt:encoded']?.[0] || '',
              };
              
              console.log('Processing attachment:', { url, filename, title });
              
              mediaItems.push({
                id,
                url,
                filename,
                title,
                alt: metadata.alt,
                caption: metadata.caption,
                description,
              });

              if (!Object.values(mediaMapping).some(mappedUrl => 
                url.toLowerCase().includes(filename) || 
                Object.keys(mediaMapping).some(pattern => 
                  new RegExp(pattern).test(filename)
                )
              )) {
                console.warn(`No matching media file found for ${filename}`);
                missingMedia.add(url);
              }
            }
          } else if (postType === 'post') {
            console.log('Processing post:', item.title?.[0]);
            
            const title = item.title?.[0];
            let content = item['content:encoded']?.[0];
            
            if (!title || !content) {
              console.warn('Post missing required fields:', { title, hasContent: !!content });
              errors.push(`Post "${title || 'Untitled'}" missing required fields`);
              continue;
            }

            // Replace WordPress media URLs with Supabase URLs
            Object.entries(mediaMapping).forEach(([pattern, supabaseUrl]) => {
              const regex = new RegExp(pattern, 'gi');
              content = content.replace(regex, supabaseUrl);
            });

            const excerpt = item['excerpt:encoded']?.[0] || '';
            const postDate = item['wp:post_date']?.[0];
            const status = item['wp:status']?.[0] || 'draft';
            
            // Process categories and tags
            const categories = Array.isArray(item.category) ? item.category : item.category ? [item.category] : [];
            const processedCategories = categories.map(cat => ({
              domain: cat?.['@domain'] || '',
              name: cat?.['#text'] || ''
            }));

            // Process featured image
            let featuredImage = null;
            const postMeta = Array.isArray(item['wp:postmeta']) ? item['wp:postmeta'] : [item['wp:postmeta']].filter(Boolean);
            const thumbnailId = postMeta?.find(
              meta => meta['wp:meta_key']?.[0] === '_thumbnail_id'
            )?.[0]?.['wp:meta_value']?.[0];

            if (thumbnailId) {
              const attachmentItem = items.find(
                i => i['wp:post_type']?.[0] === 'attachment' && i['wp:post_id']?.[0] === thumbnailId
              );
              if (attachmentItem) {
                const featuredImageUrl = attachmentItem['wp:attachment_url']?.[0];
                if (featuredImageUrl) {
                  const filename = featuredImageUrl.split('/').pop()?.toLowerCase();
                  featuredImage = filename ? mediaMapping[filename] : null;
                }
              }
            }

            console.log('Post processed:', {
              title,
              status,
              hasExcerpt: !!excerpt,
              categoriesCount: processedCategories.length,
              hasFeaturedImage: !!featuredImage
            });

            posts.push({
              title,
              content,
              excerpt,
              post_date: postDate,
              status,
              categories: processedCategories.filter(cat => cat.domain === 'category').map(cat => cat.name),
              tags: processedCategories.filter(cat => cat.domain === 'post_tag').map(cat => cat.name),
              featured_image: featuredImage,
              meta_description: postMeta?.find(
                meta => meta['wp:meta_key']?.[0] === '_yoast_wpseo_metadesc'
              )?.[0]?.['wp:meta_value']?.[0],
              focus_keyword: postMeta?.find(
                meta => meta['wp:meta_key']?.[0] === '_yoast_wpseo_focuskw'
              )?.[0]?.['wp:meta_value']?.[0],
            });
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

    console.log(`Import completed:`, {
      posts: posts.length,
      media: mediaItems.length,
      missingMedia: missingMedia.size,
      errors: errors.length
    });
    
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