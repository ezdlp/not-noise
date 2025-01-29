import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get IP from request headers
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
    
    // Call ipapi.co service
    const response = await fetch(`https://ipapi.co/${clientIP}/json/`)
    const data = await response.json()

    return new Response(
      JSON.stringify({
        ip: clientIP,
        country: data.country_name,
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
      JSON.stringify({ error: 'Failed to get location info' }),
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