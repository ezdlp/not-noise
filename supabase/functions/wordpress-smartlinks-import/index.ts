import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parse } from 'https://deno.land/x/xml@2.1.1/mod.ts'
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

    console.log('Reading XML file content...')
    const xmlContent = await xmlFile.text()
    
    console.log('Parsing XML content...')
    const doc = parse(xmlContent)
    
    if (!doc) {
      throw new Error('Failed to parse XML')
    }

    console.log('XML parsed successfully')
    const items = doc.rss?.channel?.item || []
    const processLimit = testMode ? 10 : items.length
    
    console.log(`Processing ${processLimit} items${testMode ? ' (test mode)' : ''}`)
    
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
        const title = item.title?.[0]
        const artistName = item['dc:creator']?.[0] || 'Unknown Artist'
        const platformLinksData = item['wp:postmeta']?.find(
          (meta: any) => meta['wp:meta_key']?.[0] === 'platform_links'
        )?.['wp:meta_value']?.[0]

        if (!title) {
          throw new Error('Missing required title')
        }

        console.log(`Processing item ${i + 1}: ${title}`)

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
          console.error('Error creating smart link:', smartLinkError)
          throw smartLinkError
        }

        console.log('Smart link created successfully:', smartLink.id)

        // Process platform links if they exist
        if (platformLinksData) {
          try {
            console.log('Processing platform links data:', platformLinksData)
            const unserialized = unserialize(platformLinksData)
            const platformLinks = Object.values(unserialized) as PlatformLink[]
            
            if (Array.isArray(platformLinks) && platformLinks.length > 0) {
              console.log(`Found ${platformLinks.length} platform links`)
              
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

              console.log('Platform links inserted successfully')
            } else {
              console.log('No valid platform links found in the data')
              unassignedLinks.push(title)
            }
          } catch (error) {
            console.error('Error processing platform links:', error)
            unassignedLinks.push(title)
          }
        } else {
          console.log('No platform links data found for this item')
          unassignedLinks.push(title)
        }

        successCount++
      } catch (error) {
        console.error('Error processing item:', error)
        errors.push({
          link: item.title?.[0] || 'Unknown',
          error: error.message
        })
      }
    }

    console.log('Import process completed:', {
      total: totalProcessed,
      success: successCount,
      errors: errors.length,
      unassigned: unassignedLinks.length
    })

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
    console.error('Fatal error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})