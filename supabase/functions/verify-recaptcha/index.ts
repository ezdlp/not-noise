
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const recaptchaSecret = Deno.env.get('RECAPTCHA_SECRET_KEY');
    if (!recaptchaSecret) {
      console.error('RECAPTCHA_SECRET_KEY is not set');
      return new Response(
        JSON.stringify({ error: 'reCAPTCHA configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { token } = await req.json();
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'reCAPTCHA token is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const formData = new URLSearchParams();
    formData.append('secret', recaptchaSecret);
    formData.append('response', token);

    console.log('Verifying reCAPTCHA token...');
    const response = await fetch(verificationUrl, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    console.log('reCAPTCHA verification result:', result);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: 'reCAPTCHA verification failed', details: result['error-codes'] }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(handler);
