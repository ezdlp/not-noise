
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
  <title>Password Reset</title>
</head>
<body>
  <h1>Password Reset Request</h1>
  <p>To reset your password, please click the link below:</p>
  <a href="{{ .ConfirmationURL }}">Reset Password</a>
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
      // Send email using Resend
      const emailResult = await resend.emails.send({
        from: 'Soundraiser <no-reply@soundraiser.io>',
        to: user.email,
        subject: 'Soundraiser Password Reset',
        html: htmlContent
      });

      if (!emailResult?.id) {
        throw new Error('Failed to send email through Resend');
      }

      return { success: true };
    } catch (resendError) {
      // If we hit rate limit and haven't exceeded retries, wait and try again
      if (resendError.message?.includes('rate') && retryCount < MAX_RETRIES) {
        const backoffDelay = INITIAL_DELAY * Math.pow(2, retryCount);
        console.log(`Rate limit hit for ${user.email}, retrying in ${backoffDelay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await sleep(backoffDelay);
        return sendPasswordResetWithRetry(user, retryCount + 1);
      }
      return { success: false, error: resendError.message };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function processUserBatch(users: { id: string; email: string }[]) {
  const results = [];
  
  for (const user of users) {
    try {
      console.log(`Processing reset email for user: ${user.email}`);
      
      const result = await sendPasswordResetWithRetry(user);

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
