
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const handler = async (req: Request) => {
  try {
    const { token } = await req.json();
    const recaptchaSecret = Deno.env.get('RECAPTCHA_SECRET_KEY');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'reCAPTCHA token is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const formData = new URLSearchParams();
    formData.append('secret', recaptchaSecret!);
    formData.append('response', token);

    const response = await fetch(verificationUrl, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: 'reCAPTCHA verification failed', details: result['error-codes'] }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
