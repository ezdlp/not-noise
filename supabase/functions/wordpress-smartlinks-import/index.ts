import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ImportSummary {
  total: number;
  success: number;
  errors: { link: string; error: string }[];
  unassigned: string[];
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

    console.log('File received:', file.name)

    const xmlContent = await file.text()
    console.log('XML content length:', xmlContent.length)

    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml')

    if (!xmlDoc) {
      throw new Error('Failed to parse XML')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const summary: ImportSummary = {
      total: 0,
      success: 0,
      errors: [],
      unassigned: [],
    }

    const items = xmlDoc.querySelectorAll('item')
    summary.total = items.length
    console.log('Total items found:', summary.total)

    for (const item of items) {
      try {
        const title = item.querySelector('title')?.textContent
        const creator = item.querySelector('dc\\:creator')?.textContent
        
        if (!title || !creator) {
          throw new Error('Missing required fields')
        }

        console.log('Processing item:', title, 'by', creator)

        // Get user ID from email
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', creator)
          .single()

        if (userError || !userData) {
          console.log('User not found for email:', creator)
          summary.unassigned.push(title)
          continue
        }

        const userId = userData.id

        // Extract metadata
        const metaElements = item.querySelectorAll('wp\\:postmeta')
        const metadata = new Map()
        
        for (const meta of metaElements) {
          const key = meta.querySelector('wp\\:meta_key')?.textContent
          const value = meta.querySelector('wp\\:meta_value')?.textContent
          if (key && value) {
            metadata.set(key, value)
          }
        }

        // Check for required Spotify URL
        const spotifyUrl = metadata.get('_url')
        if (!spotifyUrl) {
          throw new Error('Missing Spotify URL')
        }

        // Create smart link
        const { data: smartLink, error: smartLinkError } = await supabase
          .from('smart_links')
          .insert({
            user_id: userId,
            title: title,
            artwork_url: metadata.get('_default_image'),
            artist_name: metadata.get('_artist_name') || '',
            email_capture_enabled: false,
          })
          .select()
          .single()

        if (smartLinkError || !smartLink) {
          throw new Error(`Failed to create smart link: ${smartLinkError?.message}`)
        }

        console.log('Smart link created:', smartLink.id)

        // Parse and add platform links
        const linksStr = metadata.get('_links')
        if (linksStr) {
          try {
            // Extract URLs from PHP serialized string using regex
            const urlMatches = linksStr.match(/https?:\/\/[^\s"';]+/g) || []
            
            for (const url of urlMatches) {
              let platformId = ''
              let platformName = ''
              
              if (url.includes('spotify.com')) {
                platformId = 'spotify'
                platformName = 'Spotify'
              } else if (url.includes('music.apple.com')) {
                platformId = 'applemusic'
                platformName = 'Apple Music'
              } else if (url.includes('deezer.com')) {
                platformId = 'deezer'
                platformName = 'Deezer'
              } else if (url.includes('music.amazon.com')) {
                platformId = 'amazonmusic'
                platformName = 'Amazon Music'
              } else if (url.includes('soundcloud.com')) {
                platformId = 'soundcloud'
                platformName = 'SoundCloud'
              }

              if (platformId && platformName) {
                const { error: platformError } = await supabase
                  .from('platform_links')
                  .insert({
                    smart_link_id: smartLink.id,
                    platform_id: platformId,
                    platform_name: platformName,
                    url: url,
                  })

                if (platformError) {
                  console.error('Error adding platform link:', platformError)
                } else {
                  console.log('Added platform link:', platformName)
                }
              }
            }
          } catch (error) {
            console.error('Error parsing platform links:', error)
          }
        }

        // Import metrics if available
        const views = parseInt(metadata.get('_link_views') || '0')
        const clicks = parseInt(metadata.get('_link_clicks') || '0')

        if (views > 0) {
          const viewPromises = Array(views).fill(null).map(() => 
            supabase.from('link_views').insert({
              smart_link_id: smartLink.id,
            })
          )
          await Promise.allSettled(viewPromises)
          console.log('Added', views, 'views')
        }

        if (clicks > 0) {
          const clickPromises = Array(clicks).fill(null).map(() => 
            supabase.from('platform_clicks').insert({
              platform_link_id: smartLink.id,
            })
          )
          await Promise.allSettled(clickPromises)
          console.log('Added', clicks, 'clicks')
        }

        summary.success++
      } catch (error) {
        console.error('Error processing item:', error)
        summary.errors.push({
          link: item.querySelector('title')?.textContent || 'Unknown',
          error: error.message,
        })
      }
    }

    console.log('Import summary:', summary)

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Fatal error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})