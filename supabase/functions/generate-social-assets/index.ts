import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { Canvas, loadImage } from 'https://deno.land/x/canvas@v1.4.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PlatformDimensions {
  width: number;
  height: number;
}

const PLATFORM_DIMENSIONS: Record<string, PlatformDimensions> = {
  instagram_square: { width: 1080, height: 1080 },
  instagram_story: { width: 1080, height: 1920 },
  twitter: { width: 1200, height: 675 },
  facebook: { width: 1200, height: 630 },
  linkedin: { width: 1200, height: 627 }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { smartLinkId, platform, artworkUrl } = await req.json()

    if (!smartLinkId || !platform || !artworkUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const dimensions = PLATFORM_DIMENSIONS[platform]
    if (!dimensions) {
      return new Response(
        JSON.stringify({ error: 'Invalid platform' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create canvas with platform dimensions
    const canvas = new Canvas(dimensions.width, dimensions.height)
    const ctx = canvas.getContext('2d')

    // Load and draw artwork
    const artwork = await loadImage(artworkUrl)
    
    // Calculate dimensions to maintain aspect ratio
    const scale = Math.max(
      dimensions.width / artwork.width,
      dimensions.height / artwork.height
    )
    
    const scaledWidth = artwork.width * scale
    const scaledHeight = artwork.height * scale
    
    // Center the image
    const x = (dimensions.width - scaledWidth) / 2
    const y = (dimensions.height - scaledHeight) / 2
    
    // Draw background (blurred version of artwork)
    ctx.filter = 'blur(20px)'
    ctx.drawImage(artwork, x, y, scaledWidth, scaledHeight)
    ctx.filter = 'none'
    
    // Draw main artwork
    ctx.drawImage(artwork, x, y, scaledWidth, scaledHeight)

    // Convert canvas to buffer
    const buffer = canvas.toBuffer()

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Upload to storage
    const fileName = `${smartLinkId}/${platform}_${Date.now()}.png`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('social-media-assets')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw uploadError
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('social-media-assets')
      .getPublicUrl(fileName)

    // Save to database
    const { error: dbError } = await supabase
      .from('social_media_assets')
      .insert({
        smart_link_id: smartLinkId,
        platform,
        image_url: publicUrl
      })

    if (dbError) {
      console.error('Database error:', dbError)
      throw dbError
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        url: publicUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})