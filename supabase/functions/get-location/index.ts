
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GeoJSResponse {
  country: string;      // Full country name
  country_code: string; // Two-letter ISO code
  ip: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get IP from request headers
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
    console.log('Processing request for IP:', clientIP)
    
    // Call GeoJS service
    const response = await fetch(`https://get.geojs.io/v1/ip/geo/${clientIP}.json`)
    const data = await response.json() as GeoJSResponse

    // Validate response
    if (!data.country || !data.country_code) {
      console.error('Invalid GeoJS response:', data)
      throw new Error('Invalid location data received')
    }

    console.log('Location data received:', {
      country: data.country,
      country_code: data.country_code,
      ip: clientIP
    })

    return new Response(
      JSON.stringify({
        ip: clientIP,
        country: data.country,     // Full country name from GeoJS
        country_code: data.country_code, // Two-letter code from GeoJS
      }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    console.error('Error getting location:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get location info',
        details: error.message 
      }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      },
    )
  }
})
