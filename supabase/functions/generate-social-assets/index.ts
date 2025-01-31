import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { Canvas, loadImage } from "https://deno.land/x/canvas@v1.4.1/mod.ts";

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
}

serve(async (req) => {
  // Handle CORS
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

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create canvas with platform dimensions
    const canvas = new Canvas(dimensions.width, dimensions.height)
    const ctx = canvas.getContext('2d')

    // Load and draw artwork
    const artwork = await loadImage(artworkUrl)
    
    // Calculate scaled dimensions maintaining aspect ratio
    const scale = Math.min(
      dimensions.width / artwork.width(),
      dimensions.height / artwork.height()
    )
    
    const scaledWidth = artwork.width() * scale
    const scaledHeight = artwork.height() * scale
    
    // Center the artwork
    const x = (dimensions.width - scaledWidth) / 2
    const y = (dimensions.height - scaledHeight) / 2

    // Draw blurred background (artwork scaled up and blurred)
    ctx.filter = 'blur(20px)'
    ctx.drawImage(
      artwork,
      -50, -50,
      dimensions.width + 100,
      dimensions.height + 100
    )
    
    // Reset filter and draw centered artwork
    ctx.filter = 'none'
    ctx.drawImage(artwork, x, y, scaledWidth, scaledHeight)

    // Convert canvas to buffer
    const buffer = await canvas.toBuffer()

    // Upload to Supabase Storage
    const filePath = `${smartLinkId}/${platform}_${new Date().getTime()}.png`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('social-media-assets')
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      throw uploadError
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('social-media-assets')
      .getPublicUrl(filePath)

    // Save to social_media_assets table
    const { error: dbError } = await supabase
      .from('social_media_assets')
      .insert({
        smart_link_id: smartLinkId,
        platform,
        image_url: publicUrl
      })

    if (dbError) {
      throw dbError
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        url: publicUrl
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})