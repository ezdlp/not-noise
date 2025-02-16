
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
const cache = new Map()

async function getCountryFromGeoJS(ip: string) {
  try {
    // Try getting country name first
    const countryResponse = await fetch(`https://get.geojs.io/v1/ip/country/${ip}`);
    if (!countryResponse.ok) throw new Error('Country lookup failed');
    
    const countryCode = await countryResponse.text();
    if (!countryCode || countryCode.trim() === 'XX') {
      throw new Error('Invalid country code');
    }

    // Get full geo data to get country name
    const geoResponse = await fetch(`https://get.geojs.io/v1/ip/geo/${ip}.json`);
    if (!geoResponse.ok) throw new Error('Geo lookup failed');
    
    const geoData = await geoResponse.json();
    
    return {
      country_code: countryCode.trim(),
      country_name: geoData.country || 'Unknown'
    };
  } catch (error) {
    console.error('GeoJS lookup error:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get IP from request headers
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                    req.headers.get('x-real-ip') || 
                    '127.0.0.1';

    // Check cache first
    const cacheKey = `geo_${clientIP}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
      console.log('Cache hit for IP:', clientIP);
      return new Response(
        JSON.stringify({
          ip: clientIP,
          country: cachedData.data.country_name,
          country_code: cachedData.data.country_code,
          cached: true
        }),
        { 
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    // Get fresh data from GeoJS
    console.log('Fetching location for IP:', clientIP);
    const geoData = await getCountryFromGeoJS(clientIP);
    
    // Update cache
    cache.set(cacheKey, {
      timestamp: Date.now(),
      data: geoData
    });

    return new Response(
      JSON.stringify({
        ip: clientIP,
        country: geoData.country_name,
        country_code: geoData.country_code,
        cached: false
      }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    console.error('Error getting location:', error);
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
