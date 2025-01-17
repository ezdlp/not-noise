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
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      throw new Error('No file uploaded');
    }

    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    
    // Initialize arrays to store parsed data
    const posts = [];
    const users = [];
    const customLinks = [];
    const mediaItems = [];
    const missingMedia = new Set();

    // Parse channel information
    const channel = doc.querySelector('channel');
    if (!channel) throw new Error('Invalid WordPress export file');

    // Parse authors/users
    const authors = doc.querySelectorAll('wp\\:author');
    for (const author of authors) {
      const login = author.querySelector('wp\\:author_login')?.textContent;
      const email = author.querySelector('wp\\:author_email')?.textContent;
      const displayName = author.querySelector('wp\\:author_display_name')?.textContent;
      const firstName = author.querySelector('wp\\:author_first_name')?.textContent;
      const lastName = author.querySelector('wp\\:author_last_name')?.textContent;

      if (login && email) {
        users.push({
          login,
          email,
          display_name: displayName || login,
          first_name: firstName || '',
          last_name: lastName || '',
          role: 'user' // Default role, can be updated later
        });
      }
    }

    // Parse items (posts, pages, custom links)
    const items = doc.querySelectorAll('item');
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
        const postDate = item.querySelector('wp\\:post_date')?.textContent;
        const status = item.querySelector('wp\\:status')?.textContent;
        const author = item.querySelector('dc\\:creator')?.textContent;
        
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
          status: status || 'draft',
          author,
          post_date: postDate,
          featured_image: item.querySelector('wp\\:featured_image')?.textContent,
        });
      } else if (postType === 'smart-link') {
        // Parse custom smart link data
        const title = item.querySelector('title')?.textContent;
        const author = item.querySelector('dc\\:creator')?.textContent;
        const customFields = item.querySelectorAll('wp\\:postmeta');
        
        const linkData = {
          title,
          author,
          platforms: [],
          stats: {
            views: 0,
            clicks: 0
          }
        };

        // Parse custom fields for platform links and stats
        for (const field of customFields) {
          const key = field.querySelector('wp\\:meta_key')?.textContent;
          const value = field.querySelector('wp\\:meta_value')?.textContent;
          
          if (key?.startsWith('platform_')) {
            linkData.platforms.push({
              platform: key.replace('platform_', ''),
              url: value
            });
          } else if (key === 'total_views') {
            linkData.stats.views = parseInt(value || '0', 10);
          } else if (key === 'total_clicks') {
            linkData.stats.clicks = parseInt(value || '0', 10);
          }
        }

        customLinks.push(linkData);
      }
    }

    return new Response(
      JSON.stringify({
        posts,
        users,
        customLinks,
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