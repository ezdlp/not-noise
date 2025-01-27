import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
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
    console.log('[Import] Starting WordPress import process');
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      console.error('[Import] No file uploaded');
      throw new Error('No file uploaded');
    }

    console.log('[Import] File received:', file.name, 'Size:', file.size);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch existing media files
    const { data: existingMedia, error: mediaError } = await supabase
      .from('media_files')
      .select('filename, file_path');

    if (mediaError) {
      console.error('[Import] Error fetching media files:', mediaError);
      throw new Error('Failed to fetch media files');
    }

    console.log('[Import] Fetched existing media files:', existingMedia?.length || 0);

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
    console.log('[Import] File content length:', text.length);

    let xmlDoc;
    try {
      console.log('[Import] Attempting to parse XML...');
      const parser = new DOMParser();
      xmlDoc = parser.parseFromString(text, "text/xml");
      
      if (!xmlDoc) {
        console.error('[Import] Failed to parse XML document');
        throw new Error('Failed to parse XML document');
      }

      console.log('[Import] XML parsed successfully');
      
      const channel = xmlDoc.querySelector('channel');
      if (!channel) {
        console.error('[Import] Missing channel element in RSS structure');
        throw new Error('Invalid WordPress export file - missing channel element');
      }

      console.log('[Import] Channel found, processing items...');

      const posts: WordPressPost[] = [];
      const mediaItems: MediaItem[] = [];
      const missingMedia = new Set<string>();
      const errors: string[] = [];

      const items = Array.from(xmlDoc.querySelectorAll('item'));
      console.log(`[Import] Found ${items.length} items in the XML file`);

      if (items.length === 0) {
        console.error('[Import] No items found in the XML file');
        throw new Error('No items found in the WordPress export file');
      }

      // Process items in chunks
      for (let i = 0; i < items.length; i += CHUNK_SIZE) {
        const chunk = items.slice(i, i + CHUNK_SIZE);
        console.log(`[Import] Processing chunk ${Math.floor(i / CHUNK_SIZE) + 1} of ${Math.ceil(items.length / CHUNK_SIZE)}`);

        for (const item of chunk) {
          try {
            const title = item.querySelector('title')?.textContent;
            const postType = item.querySelector('wp\\:post_type')?.textContent;
            
            console.log('[Import] Processing item:', {
              title,
              type: postType,
              status: item.querySelector('wp\\:status')?.textContent,
            });

            if (!postType) {
              console.warn('[Import] Item missing post type:', title);
              continue;
            }
            
            if (postType === 'attachment') {
              const url = item.querySelector('wp\\:attachment_url')?.textContent;
              if (url) {
                const id = item.querySelector('wp\\:post_id')?.textContent || crypto.randomUUID();
                const description = item.querySelector('content\\:encoded')?.textContent || '';
                const filename = url.split('/').pop()?.toLowerCase() || '';
                
                const metadata = {
                  alt: Array.from(item.querySelectorAll('wp\\:postmeta')).find(meta => 
                    meta.querySelector('wp\\:meta_key')?.textContent === '_wp_attachment_image_alt'
                  )?.querySelector('wp\\:meta_value')?.textContent || '',
                  caption: item.querySelector('excerpt\\:encoded')?.textContent || '',
                };
                
                console.log('[Import] Processing attachment:', { url, filename, title });
                
                mediaItems.push({
                  id,
                  url,
                  filename,
                  title: title || '',
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
                  console.warn(`[Import] No matching media file found for ${filename}`);
                  missingMedia.add(url);
                }
              }
            } else if (postType === 'post') {
              console.log('[Import] Processing post:', title);
              
              let content = item.querySelector('content\\:encoded')?.textContent;
              
              if (!title || !content) {
                console.warn('[Import] Post missing required fields:', { title, hasContent: !!content });
                errors.push(`Post "${title || 'Untitled'}" missing required fields`);
                continue;
              }

              // Replace WordPress media URLs with Supabase URLs
              Object.entries(mediaMapping).forEach(([pattern, supabaseUrl]) => {
                const regex = new RegExp(pattern, 'gi');
                content = content!.replace(regex, supabaseUrl);
              });

              const excerpt = item.querySelector('excerpt\\:encoded')?.textContent || '';
              const postDate = item.querySelector('wp\\:post_date')?.textContent;
              const status = item.querySelector('wp\\:status')?.textContent || 'draft';
              
              // Process categories and tags
              const categories = Array.from(item.querySelectorAll('category'));
              const processedCategories = categories.map(cat => ({
                domain: cat.getAttribute('domain') || '',
                name: cat.textContent || ''
              }));

              // Process featured image
              let featuredImage = null;
              const postMetas = Array.from(item.querySelectorAll('wp\\:postmeta'));
              const thumbnailId = postMetas.find(
                meta => meta.querySelector('wp\\:meta_key')?.textContent === '_thumbnail_id'
              )?.querySelector('wp\\:meta_value')?.textContent;

              if (thumbnailId) {
                const attachmentItem = items.find(
                  i => i.querySelector('wp\\:post_type')?.textContent === 'attachment' && 
                      i.querySelector('wp\\:post_id')?.textContent === thumbnailId
                );
                if (attachmentItem) {
                  const featuredImageUrl = attachmentItem.querySelector('wp\\:attachment_url')?.textContent;
                  if (featuredImageUrl) {
                    const filename = featuredImageUrl.split('/').pop()?.toLowerCase();
                    featuredImage = filename ? mediaMapping[filename] : null;
                  }
                }
              }

              console.log('[Import] Post processed:', {
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
                meta_description: postMetas.find(
                  meta => meta.querySelector('wp\\:meta_key')?.textContent === '_yoast_wpseo_metadesc'
                )?.querySelector('wp\\:meta_value')?.textContent,
                focus_keyword: postMetas.find(
                  meta => meta.querySelector('wp\\:meta_key')?.textContent === '_yoast_wpseo_focuskw'
                )?.querySelector('wp\\:meta_value')?.textContent,
              });
            }
          } catch (itemError) {
            console.error('[Import] Error processing item:', itemError);
            errors.push(itemError.message);
          }

          // Free up memory after processing each item
          if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
      }

      console.log(`[Import] Import completed:`, {
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
    } catch (parseError) {
      console.error('[Import] XML parsing error:', parseError);
      console.error('[Import] Raw file content (first 1000 chars):', text.substring(0, 1000)); 
      throw new Error(`Failed to parse WordPress export file: ${parseError.message}`);
    }
  } catch (error) {
    console.error('[Import] Error processing WordPress import:', error);
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