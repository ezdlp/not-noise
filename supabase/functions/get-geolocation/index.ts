import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ip } = await req.json();
    console.log('Getting geolocation for IP:', ip);

    // Use a free IP geolocation API
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    
    console.log('Geolocation response:', data);

    return new Response(
      JSON.stringify({
        country: data.status === 'success' ? data.country : 'Unknown',
        countryCode: data.status === 'success' ? data.countryCode : null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error getting geolocation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});