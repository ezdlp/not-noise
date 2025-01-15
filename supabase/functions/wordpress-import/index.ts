import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlContent, 'text/xml')

    if (!doc) {
      throw new Error('Invalid XML file')
    }

    const items = doc.getElementsByTagName('item')
    const posts = []

    for (const item of items) {
      const title = item.getElementsByTagName('title')[0]?.textContent
      const content = item.getElementsByTagName('content:encoded')[0]?.textContent
      const excerpt = item.getElementsByTagName('excerpt:encoded')[0]?.textContent
      const pubDate = item.getElementsByTagName('pubDate')[0]?.textContent
      const status = item.getElementsByTagName('wp:status')[0]?.textContent
      
      // Get featured image if exists
      const featuredImage = Array.from(item.getElementsByTagName('wp:postmeta'))
        .find(meta => 
          meta.getElementsByTagName('wp:meta_key')[0]?.textContent === '_thumbnail_id'
        )

      // Get categories and tags
      const categories = Array.from(item.getElementsByTagName('category'))
        .map(cat => ({
          domain: cat.getAttribute('domain'),
          name: cat.textContent
        }))
        .filter(cat => cat.name)

      posts.push({
        title: title || 'Untitled',
        content: content || '',
        excerpt: excerpt || '',
        status: status === 'publish' ? 'published' : 'draft',
        meta_description: excerpt?.substring(0, 160) || '',
        visibility: 'public',
        allow_comments: true,
        is_featured: false,
        is_sticky: false,
        format: 'standard',
        categories: categories
          .filter(cat => cat.domain === 'category')
          .map(cat => cat.name),
        tags: categories
          .filter(cat => cat.domain === 'post_tag')
          .map(cat => cat.name)
      })
    }

    // Get media items for reference
    const mediaItems = Array.from(doc.getElementsByTagName('wp:attachment_url'))
      .map(item => item.textContent)
      .filter(url => url)

    return new Response(
      JSON.stringify({ 
        posts,
        mediaItems,
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