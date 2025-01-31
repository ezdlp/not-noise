import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createCanvas, loadImage } from 'https://deno.land/x/canvas@v1.4.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface PlatformConfig {
  width: number;
  height: number;
  artworkSize: number;
}

const platformConfigs: Record<string, PlatformConfig> = {
  instagram_square: {
    width: 1080,
    height: 1080,
    artworkSize: 600,
  },
  // Add more platform configurations as needed
}

async function generateSocialAsset(
  artworkUrl: string,
  platform: string,
  config: PlatformConfig
): Promise<Blob> {
  console.log('Generating social asset with config:', config);
  
  // Create canvas with platform dimensions
  const canvas = createCanvas(config.width, config.height);
  const ctx = canvas.getContext('2d');

  // Load artwork image
  const artwork = await loadImage(artworkUrl);
  console.log('Artwork loaded successfully');

  // Fill background with gradient
  const gradient = ctx.createLinearGradient(0, 0, config.width, config.height);
  gradient.addColorStop(0, '#6851FB');  // Majorelle Blue
  gradient.addColorStop(1, '#4A47A5');  // Darker shade
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, config.width, config.height);

  // Calculate centered position for artwork
  const x = (config.width - config.artworkSize) / 2;
  const y = (config.height - config.artworkSize) / 2;

  // Draw artwork centered
  ctx.drawImage(artwork, x, y, config.artworkSize, config.artworkSize);

  // Add platform-specific overlays or text if needed
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '30px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Listen Now', config.width / 2, y + config.artworkSize + 50);

  // Convert canvas to blob
  const blob = await canvas.toBlob();
  console.log('Canvas converted to blob successfully');
  return blob;
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

    // Get platform configuration
    const platformConfig = platformConfigs[platform];
    if (!platformConfig) {
      throw new Error('Invalid platform specified');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Generate the social media asset
    const assetBlob = await generateSocialAsset(artworkUrl, platform, platformConfig);

    // Generate a unique filename
    const timestamp = new Date().getTime()
    const filename = `${smartLinkId}-${platform}-${timestamp}.png`
    const filePath = `${smartLinkId}/${filename}`

    console.log('Uploading to storage...')

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('social-media-assets')
      .upload(filePath, assetBlob, {
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