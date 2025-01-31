import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    // Parse request body
    const { smartLinkId, platform, artworkUrl } = await req.json()
    
    if (!smartLinkId || !platform || !artworkUrl) {
      throw new Error('Missing required parameters')
    }

    console.log('Generating asset for:', { smartLinkId, platform, artworkUrl })

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Generate a unique filename
    const timestamp = new Date().getTime()
    const filename = `${smartLinkId}-${platform}-${timestamp}.png`
    const filePath = `${smartLinkId}/${filename}`

    // Download the artwork
    const artworkResponse = await fetch(artworkUrl)
    if (!artworkResponse.ok) {
      throw new Error('Failed to fetch artwork')
    }
    const artworkBlob = await artworkResponse.blob()

    console.log('Uploading to storage...')

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('social-media-assets')
      .upload(filePath, artworkBlob, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error('Failed to upload generated asset')
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient
      .storage
      .from('social-media-assets')
      .getPublicUrl(filePath)

    console.log('Asset generated successfully:', publicUrl)

    // Store asset record in database
    const { error: dbError } = await supabaseClient
      .from('social_media_assets')
      .insert({
        smart_link_id: smartLinkId,
        platform,
        image_url: publicUrl
      })

    if (dbError) {
      console.error('Database error:', dbError)
      // Don't throw here, as we still want to return the URL
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl: publicUrl
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})