import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      throw new Error('No file uploaded');
    }

    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    
    const items = doc.querySelectorAll('item');
    const posts = [];
    const mediaItems = [];
    const missingMedia = new Set();

    for (const item of items) {
      const postType = item.querySelector('wp\\:post_type')?.textContent;
      
      if (postType === 'attachment') {
        const url = item.querySelector('wp\\:attachment_url')?.textContent;
        if (url) {
          const id = item.querySelector('wp\\:post_id')?.textContent || crypto.randomUUID();
          const title = item.querySelector('title')?.textContent;
          const description = item.querySelector('description')?.textContent;
          
          // Extract alt text and other metadata from content
          const content = item.querySelector('content\\:encoded')?.textContent || '';
          const altMatch = content.match(/alt="([^"]*)"/);
          const captionMatch = content.match(/caption="([^"]*)"/);
          
          mediaItems.push({
            id,
            url,
            title,
            alt: altMatch?.[1],
            caption: captionMatch?.[1],
            description,
          });
        }
      } else if (postType === 'post') {
        const content = item.querySelector('content\\:encoded')?.textContent || '';
        
        // Find all img tags and collect their sources
        const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
        let match;
        
        while ((match = imgRegex.exec(content)) !== null) {
          const imgUrl = match[1];
          if (!mediaItems.some(item => item.url === imgUrl)) {
            missingMedia.add(imgUrl);
          }
        }

        posts.push({
          title: item.querySelector('title')?.textContent,
          content,
          excerpt: item.querySelector('excerpt\\:encoded')?.textContent,
          status: item.querySelector('wp\\:status')?.textContent || 'draft',
          featured_image: item.querySelector('wp\\:featured_image')?.textContent,
        });
      }
    }

    return new Response(
      JSON.stringify({
        posts,
        mediaItems,
        missingMedia: Array.from(missingMedia),
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
      JSON.stringify({ error: error.message }),
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