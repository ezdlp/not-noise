
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://soundraiser.io',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

// Initialize Resend
const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

// Create Supabase client with admin privileges
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const BATCH_SIZE = 5;
const INITIAL_DELAY = 1000; // 1 second between emails
const MAX_RETRIES = 3;

const emailTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Soundraiser just got way better! 🎉</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      margin: 0;
      padding: 0;
      color: #0F0F0F;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
    }
    .logo {
      max-width: 200px;
      margin-bottom: 20px;
    }
    .title {
      color: #6851FB;
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 20px;
    }
    .feature-list {
      background: #F8F8F8;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .feature-item {
      margin-bottom: 15px;
    }
    .button {
      display: inline-block;
      background-color: #6851FB;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      margin: 20px 0;
      font-weight: 500;
    }
    .button:hover {
      background-color: #4A47A5;
    }
    .footer {
      text-align: center;
      color: #666666;
      font-size: 12px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #E6E6E6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://soundraiser.io/assets/soundraiser-logo.png" alt="Soundraiser Logo" class="logo">
      <h1 class="title">Soundraiser just got way better! 🎉</h1>
    </div>
    
    <p>Hey there!</p>
    
    <p>We've been working hard to make Soundraiser even better for you. Here's what's new:</p>
    
    <div class="feature-list">
      <div class="feature-item">✨ <strong>Smart Links:</strong> Create beautiful landing pages for your music in seconds</div>
      <div class="feature-item">📊 <strong>Analytics Dashboard:</strong> Track your performance across all platforms</div>
      <div class="feature-item">🎯 <strong>Meta Pixel Integration:</strong> Retarget your fans with precision</div>
      <div class="feature-item">🎨 <strong>Social Media Tools:</strong> Generate eye-catching assets automatically</div>
    </div>
    
    <p>To access all these amazing features, you'll need to reset your password first. Click the button below:</p>
    
    <div style="text-align: center;">
      <a href="{{ .ConfirmationURL }}" class="button">Reset Your Password</a>
    </div>
    
    <p><strong>Pro Plan Update:</strong> We've also introduced a new Pro plan with advanced features to help you grow your audience faster than ever!</p>
    
    <p>All your previously imported Smart Links are waiting for you in your dashboard. Just reset your password and you'll be ready to go!</p>
    
    <div class="footer">
      <p>© 2024 Soundraiser. All rights reserved.</p>
      <p>You're receiving this email because you requested a password reset.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>`;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendPasswordResetWithRetry(user: { id: string; email: string }, retryCount = 0): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate password reset token
    const { data: tokenData, error: tokenError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: user.email,
      options: {
        redirectTo: 'https://soundraiser.io/login'
      }
    });

    if (tokenError) {
      return { success: false, error: tokenError.message };
    }

    // Extract the reset URL from the response
    const resetUrl = tokenData?.properties?.action_link;
    if (!resetUrl) {
      return { success: false, error: 'No reset URL generated' };
    }

    // Replace the placeholder in the template with the actual reset URL
    const htmlContent = emailTemplate.replace('{{ .ConfirmationURL }}', resetUrl);

    try {
      // Send email using Resend with more detailed logging
      console.log(`Attempting to send email to ${user.email}...`);
      
      const emailResult = await resend.emails.send({
        from: 'Soundraiser <hello@soundraiser.io>',
        to: user.email,
        subject: 'Soundraiser just got way better! 🎉',
        html: htmlContent
      });

      // Log the full response for debugging
      console.log(`Resend API Response for ${user.email}:`, JSON.stringify(emailResult));

      // Update success check to be more lenient
      // If we get a response object at all, consider it a success unless there's an error
      if (emailResult && !emailResult.error) {
        console.log(`Successfully sent email to ${user.email}`);
        return { success: true };
      } else {
        const errorMessage = emailResult.error?.message || 'Unknown error occurred';
        console.error(`Resend API error for ${user.email}:`, errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (resendError: any) {
      // Log the full error object for debugging
      console.error(`Detailed Resend error for ${user.email}:`, JSON.stringify(resendError));

      // If we hit rate limit and haven't exceeded retries, wait and try again
      if (resendError.message?.includes('rate') && retryCount < MAX_RETRIES) {
        const backoffDelay = INITIAL_DELAY * Math.pow(2, retryCount);
        console.log(`Rate limit hit for ${user.email}, retrying in ${backoffDelay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await sleep(backoffDelay);
        return sendPasswordResetWithRetry(user, retryCount + 1);
      }

      return { 
        success: false, 
        error: `Resend error: ${resendError.message || 'Unknown error'}`
      };
    }
  } catch (error: any) {
    console.error(`Unexpected error for ${user.email}:`, error);
    return { 
      success: false, 
      error: `Unexpected error: ${error.message || 'Unknown error'}`
    };
  }
}

async function processUserBatch(users: { id: string; email: string }[]) {
  const results = [];
  
  for (const user of users) {
    try {
      console.log(`Processing reset email for user: ${user.email}`);
      
      const result = await sendPasswordResetWithRetry(user);
      
      // Log the result regardless of success/failure
      console.log(`Result for ${user.email}:`, JSON.stringify(result));

      if (!result.success) {
        console.error(`Error sending reset email to ${user.email}:`, result.error);
        results.push({ email: user.email, success: false, error: result.error });
      } else {
        console.log(`Successfully sent reset email to ${user.email}`);
        results.push({ email: user.email, success: true });
      }

      // Wait between emails to avoid rate limits
      await sleep(INITIAL_DELAY);
    } catch (error) {
      console.error(`Unexpected error for ${user.email}:`, error);
      results.push({ email: user.email, success: false, error: error.message });
    }
  }

  return results;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    // Get request parameters
    const { offset = 0, limit = BATCH_SIZE } = await req.json().catch(() => ({}));
    
    // Get users with pagination
    const { data: users, error: fetchError, count } = await supabaseAdmin
      .from('profiles')
      .select('id, email', { count: 'exact' })
      .not('email', 'is', null)
      .range(offset, offset + limit - 1);

    if (fetchError) {
      throw new Error(`Error fetching users: ${fetchError.message}`);
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: "No more users to process",
          complete: true
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Processing users ${offset + 1} to ${offset + users.length} of ${count}`);

    // Process the current batch
    const results = await processUserBatch(users);

    // Calculate summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        message: "Batch processing completed",
        summary: {
          total: results.length,
          successful,
          failed
        },
        progress: {
          processed: offset + users.length,
          total: count,
          complete: offset + users.length >= count,
        },
        nextOffset: offset + users.length,
        results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);

