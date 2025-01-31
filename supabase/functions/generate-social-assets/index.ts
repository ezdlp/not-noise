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
    artworkSize: 500,
  },
}

async function generateSocialAsset(
  artworkUrl: string,
  platform: string,
  config: PlatformConfig,
  title: string,
  artistName: string
): Promise<Uint8Array> {
  console.log('Generating social asset with config:', config);
  
  // Create canvas with platform dimensions
  const canvas = createCanvas(config.width, config.height);
  const ctx = canvas.getContext('2d');

  // Load artwork image
  const artwork = await loadImage(artworkUrl);
  console.log('Artwork loaded successfully');

  // Draw blurred background
  ctx.filter = 'blur(20px)';
  ctx.drawImage(artwork, 0, 0, config.width, config.height);
  ctx.filter = 'none';

  // Add semi-transparent overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, config.width, config.height);

  // Calculate centered position for artwork
  const x = (config.width - config.artworkSize) / 2;
  const y = (config.height - config.artworkSize) / 2;

  // Draw sharp artwork centered
  ctx.drawImage(artwork, x, y, config.artworkSize, config.artworkSize);

  // Configure text styling
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Draw artist name above artwork
  ctx.font = 'bold 48px Arial';
  ctx.fillText(artistName, config.width / 2, y - 40);

  // Draw title below artwork
  ctx.font = '36px Arial';
  ctx.fillText(title, config.width / 2, y + config.artworkSize + 60);

  // Draw "Listen on" text
  ctx.font = '24px Arial';
  ctx.fillText('Listen on:', config.width / 2, y + config.artworkSize + 120);

  // Draw platform icons placeholder text (we'll add actual icons in a future update)
  ctx.font = '32px Arial';
  ctx.fillText('Spotify • Apple Music • YouTube Music', config.width / 2, y + config.artworkSize + 160);

  try {
    const pngData = canvas.toBuffer('image/png');
    console.log('Canvas encoded to PNG successfully');
    return pngData;
  } catch (error) {
    console.error('Error encoding canvas:', error);
    throw new Error(`Failed to encode canvas: ${error.message}`);
  }
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
    const { smartLinkId, platform, artworkUrl, title, artistName } = await req.json()
    
    if (!smartLinkId || !platform || !artworkUrl || !title || !artistName) {
      throw new Error('Missing required parameters')
    }

    console.log('Generating asset for:', { smartLinkId, platform, artworkUrl, title, artistName })

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
    const pngBytes = await generateSocialAsset(artworkUrl, platform, platformConfig, title, artistName);

    // Generate a unique filename
    const timestamp = new Date().getTime()
    const filename = `${smartLinkId}-${platform}-${timestamp}.png`
    const filePath = `${smartLinkId}/${filename}`

    console.log('Uploading to storage...')

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('social-media-assets')
      .upload(filePath, pngBytes, {
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