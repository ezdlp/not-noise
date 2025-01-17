import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { parse } from "https://deno.land/x/xml@2.1.1/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MediaItem {
  id: string;
  url: string;
  title?: string;
  alt?: string;
  caption?: string;
  description?: string;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file) {
      throw new Error('No file uploaded')
    }

    const xmlContent = await file.text()
    console.log("Received XML content length:", xmlContent.length)

    const doc = parse(xmlContent)
    console.log("Parsed XML document")

    if (!doc) {
      throw new Error('Invalid XML file')
    }

    const items = doc.rss?.channel?.item || []
    console.log("Found items:", items.length)

    // Track media items and their usage
    const mediaItems = new Map<string, MediaItem>();
    const missingMedia: string[] = [];

    const posts = items.map(item => {
      // Extract content from CDATA if present
      const getContent = (field: string) => {
        const content = item[field]
        if (typeof content === 'object' && content?._cdata) {
          return content._cdata
        }
        return content || ''
      }

      const title = getContent('title')
      let content = getContent('content:encoded')
      const excerpt = getContent('excerpt:encoded')
      const status = item['wp:status'] === 'publish' ? 'published' : 'draft'
      
      // Process attachments and media
      const attachments = Array.isArray(item['wp:attachment_url']) 
        ? item['wp:attachment_url'] 
        : [item['wp:attachment_url']].filter(Boolean);

      // Process post meta
      const postmeta = Array.isArray(item['wp:postmeta']) ? item['wp:postmeta'] : [];
      
      // Extract featured image
      const featuredImageMeta = postmeta.find(meta => 
        meta['wp:meta_key'] === '_thumbnail_id'
      );

      // Process media in content
      const mediaRegex = /<img[^>]+src="([^">]+)"/g;
      const mediaMatches = [...content.matchAll(mediaRegex)];
      
      mediaMatches.forEach(match => {
        const url = match[1];
        const id = url.split('/').pop() || crypto.randomUUID();
        
        if (!mediaItems.has(id)) {
          mediaItems.set(id, {
            id,
            url,
            alt: match[0].match(/alt="([^"]*)"/?/)?.[1],
            title: match[0].match(/title="([^"]*)"/?/)?.[1],
          });
        }
      });

      // Add placeholders for missing media
      content = content.replace(mediaRegex, (match, url) => {
        const id = url.split('/').pop() || '';
        if (!mediaItems.has(id)) {
          missingMedia.push(url);
          return `<!-- Missing media: ${url} -->`;
        }
        return match;
      });

      // Get categories and tags
      const categories = Array.isArray(item.category) ? item.category : []
      const processedCategories = categories.map(cat => ({
        domain: cat?._attributes?.domain,
        name: cat?._text || cat
      })).filter(cat => cat.name)

      return {
        title: title || 'Untitled',
        content,
        excerpt: excerpt || '',
        status: status,
        meta_description: excerpt?.substring(0, 160) || '',
        visibility: 'public',
        allow_comments: true,
        is_featured: false,
        is_sticky: false,
        format: 'standard',
        categories: processedCategories
          .filter(cat => cat.domain === 'category')
          .map(cat => cat.name),
        tags: processedCategories
          .filter(cat => cat.domain === 'post_tag')
          .map(cat => cat.name),
        mediaItems: Array.from(mediaItems.values()),
        missingMedia,
      }
    })

    console.log(`Successfully processed ${posts.length} posts and found ${mediaItems.size} media items`)
    console.log(`Found ${missingMedia.length} missing media references`)

    return new Response(
      JSON.stringify({ 
        posts,
        mediaItems: Array.from(mediaItems.values()),
        missingMedia,
        message: `Successfully converted ${posts.length} posts` 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error("Error processing WordPress XML:", error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process WordPress XML', 
        details: error.message 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 400 
      }
    )
  }
})