import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts'
import { unserialize } from 'https://esm.sh/php-unserialize@0.0.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PlatformLink {
  type: string;
  url: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const xmlFile = formData.get('file') as File
    const testMode = formData.get('testMode') === 'true'
    
    if (!xmlFile) {
      throw new Error('No file provided')
    }

    const xmlContent = await xmlFile.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlContent, 'text/xml')

    if (!doc) {
      throw new Error('Failed to parse XML')
    }

    const items = doc.querySelectorAll('item')
    const processLimit = testMode ? 10 : items.length
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let totalProcessed = 0
    let successCount = 0
    const errors: { link: string; error: string }[] = []
    const unassignedLinks: string[] = []

    for (let i = 0; i < Math.min(items.length, processLimit); i++) {
      const item = items[i]
      totalProcessed++

      try {
        const title = item.querySelector('title')?.textContent
        const artistName = item.querySelector('dc\\:creator')?.textContent || 'Unknown Artist'
        const platformLinksData = item.querySelector('wp\\:postmeta:has(wp\\:meta_key:contains("platform_links")) wp\\:meta_value')?.textContent

        if (!title) {
          throw new Error('Missing required title')
        }

        // Create smart link
        const { data: smartLink, error: smartLinkError } = await supabaseClient
          .from('smart_links')
          .insert({
            title,
            artist_name: artistName,
            user_id: (await supabaseClient.auth.getUser()).data.user?.id
          })
          .select()
          .single()

        if (smartLinkError) {
          throw smartLinkError
        }

        // Process platform links if they exist
        if (platformLinksData) {
          try {
            const unserialized = unserialize(platformLinksData)
            // Convert numbered keys object to array using Object.values()
            const platformLinks = Object.values(unserialized) as PlatformLink[]
            
            if (Array.isArray(platformLinks) && platformLinks.length > 0) {
              const platformLinksToInsert = platformLinks.map(link => ({
                smart_link_id: smartLink.id,
                platform_id: link.type,
                platform_name: link.type.charAt(0).toUpperCase() + link.type.slice(1),
                url: link.url
              }))

              const { error: platformLinksError } = await supabaseClient
                .from('platform_links')
                .insert(platformLinksToInsert)

              if (platformLinksError) {
                console.error('Error inserting platform links:', platformLinksError)
                throw new Error(`Failed to insert platform links: ${platformLinksError.message}`)
              }
            }
          } catch (error) {
            console.error('Error processing platform links:', error)
            unassignedLinks.push(title)
          }
        }

        successCount++
      } catch (error) {
        errors.push({
          link: item.querySelector('title')?.textContent || 'Unknown',
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        total: totalProcessed,
        success: successCount,
        errors,
        unassigned: unassignedLinks
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})