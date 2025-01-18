import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    
    if (!doc.querySelector('rss')) {
      throw new Error('Invalid WordPress export file format');
    }

    console.log('Successfully parsed WordPress XML file');

    // Initialize arrays to store parsed data
    const posts = [];
    const mediaItems = [];
    const missingMedia = new Set();

    // Parse channel information
    const channel = doc.querySelector('channel');
    if (!channel) throw new Error('Invalid WordPress export file structure');

    // Parse items (posts and media)
    const items = doc.querySelectorAll('item');
    console.log(`Found ${items.length} items in the XML file`);

    for (const item of items) {
      const postType = item.querySelector('wp\\:post_type')?.textContent;
      
      if (postType === 'attachment') {
        const url = item.querySelector('wp\\:attachment_url')?.textContent;
        if (url) {
          const id = item.querySelector('wp\\:post_id')?.textContent || crypto.randomUUID();
          const title = item.querySelector('title')?.textContent;
          const description = item.querySelector('description')?.textContent;
          const filename = url.split('/').pop();
          
          // Extract alt text and other metadata from content
          const content = item.querySelector('content\\:encoded')?.textContent || '';
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
        let content = item.querySelector('content\\:encoded')?.textContent || '';
        const postDate = item.querySelector('wp\\:post_date')?.textContent;
        const status = item.querySelector('wp\\:status')?.textContent;
        const author = item.querySelector('dc\\:creator')?.textContent;
        
        // Find all img tags and collect their sources
        const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
        let match;
        while ((match = imgRegex.exec(content)) !== null) {
          const imgUrl = match[1];
          const filename = imgUrl.split('/').pop();
          
          // Replace WordPress URLs with local media library URLs
          const { data: mediaFile } = await supabase
            .from('media_files')
            .select('file_path')
            .eq('filename', filename)
            .single();

          if (mediaFile) {
            const { data: { publicUrl } } = supabase.storage
              .from('media-library')
              .getPublicUrl(mediaFile.file_path);
            
            content = content.replace(imgUrl, publicUrl);
          } else {
            missingMedia.add(imgUrl);
          }
        }

        // Parse categories
        const categories = Array.from(item.querySelectorAll('category')).map(cat => ({
          domain: cat.getAttribute('domain'),
          name: cat.textContent
        }));

        // Parse post meta
        const postMeta = Array.from(item.querySelectorAll('wp\\:postmeta')).reduce((acc, meta) => {
          const key = meta.querySelector('wp\\:meta_key')?.textContent;
          const value = meta.querySelector('wp\\:meta_value')?.textContent;
          if (key) acc[key] = value;
          return acc;
        }, {});

        posts.push({
          title: item.querySelector('title')?.textContent,
          content,
          excerpt: item.querySelector('excerpt\\:encoded')?.textContent,
          status: status || 'draft',
          author,
          post_date: postDate,
          categories: categories.filter(cat => cat.domain === 'category').map(cat => cat.name),
          tags: categories.filter(cat => cat.domain === 'post_tag').map(cat => cat.name),
          meta: postMeta,
          featured_image: postMeta['_thumbnail_id'] ? item.querySelector(`wp\\:attachment_url`)?.textContent : null
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