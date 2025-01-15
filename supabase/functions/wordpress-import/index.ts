import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { parse } from "https://deno.land/x/xml@2.1.1/mod.ts";

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
    console.log("Received XML content length:", xmlContent.length)

    const doc = parse(xmlContent)
    console.log("Parsed XML document")

    if (!doc) {
      throw new Error('Invalid XML file')
    }

    const items = doc.rss?.channel?.item || []
    console.log("Found items:", items.length)

    const posts = items.map(item => {
      // Extract content from CDATA if present
      const getContent = (field) => {
        const content = item[field]
        if (typeof content === 'object' && content?._cdata) {
          return content._cdata
        }
        return content || ''
      }

      const title = getContent('title')
      const content = getContent('content:encoded')
      const excerpt = getContent('excerpt:encoded')
      const status = item['wp:status'] === 'publish' ? 'published' : 'draft'
      
      // Get featured image if exists
      const postmeta = Array.isArray(item['wp:postmeta']) ? item['wp:postmeta'] : []
      const featuredImageMeta = postmeta.find(meta => 
        meta['wp:meta_key'] === '_thumbnail_id'
      )

      // Get categories and tags
      const categories = Array.isArray(item.category) ? item.category : []
      const processedCategories = categories.map(cat => ({
        domain: cat?._attributes?.domain,
        name: cat?._text || cat
      })).filter(cat => cat.name)

      return {
        title: title || 'Untitled',
        content: content || '',
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
          .map(cat => cat.name)
      }
    })

    // Get media items
    const mediaItems = items
      .filter(item => item['wp:post_type'] === 'attachment')
      .map(item => item['wp:attachment_url'])
      .filter(url => url)

    console.log(`Successfully processed ${posts.length} posts and found ${mediaItems.length} media items`)

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