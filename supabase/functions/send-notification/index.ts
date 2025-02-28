
import { serve } from 'https://deno.land/std@0.170.0/http/server.ts'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Email service configuration
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'notifications@soundraiser.com'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Make sure the request is a POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Parse the request body
    const data = await req.json()
    
    // Validate required fields
    if (!data.to || !data.subject || !data.message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, or message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if Resend API key is configured
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send the email using Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: data.to,
        subject: data.subject,
        html: `<div>${data.message.replace(/\n/g, '<br>')}</div>`,
        text: data.message
      })
    })

    const result = await res.json()

    if (!res.ok) {
      console.error('Error sending email:', result)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: result }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✓ Notification sent to ${data.to} with subject: ${data.subject}`)
    
    // Return success response
    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing notification request:', error.message)
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
