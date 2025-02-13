
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://soundraiser.io',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

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

const BATCH_SIZE = 10; // Reduced batch size to avoid timeouts
const DELAY_BETWEEN_EMAILS = 200;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processUserBatch(users: { id: string; email: string }[]) {
  const results = [];
  
  for (const user of users) {
    try {
      console.log(`Processing reset email for user: ${user.email}`);
      
      // Send password reset email using the correct method
      const { data, error } = await supabaseAdmin.auth.resetPasswordForEmail(user.email, {
        redirectTo: 'https://soundraiser.io/login'
      });

      if (error) {
        console.error(`Error sending reset email to ${user.email}:`, error);
        results.push({ email: user.email, success: false, error: error.message });
        
        await supabaseAdmin
          .from('user_migration_status')
          .upsert({
            user_id: user.id,
            email: user.email,
            status: 'failed',
            error_message: error.message,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
      } else {
        console.log(`Successfully sent reset email to ${user.email}`);
        results.push({ email: user.email, success: true });
        
        await supabaseAdmin
          .from('user_migration_status')
          .upsert({
            user_id: user.id,
            email: user.email,
            status: 'email_sent',
            reset_email_sent_at: new Date().toISOString(),
            error_message: null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
      }

      await sleep(DELAY_BETWEEN_EMAILS);
    } catch (error) {
      console.error(`Unexpected error for ${user.email}:`, error);
      results.push({ email: user.email, success: false, error: error.message });
      
      await supabaseAdmin
        .from('user_migration_status')
        .upsert({
          user_id: user.id,
          email: user.email,
          status: 'failed',
          error_message: error.message,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
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

    // Initialize migration status for this batch
    const migrationStatusData = users.map(user => ({
      user_id: user.id,
      email: user.email,
      status: 'pending',
    }));

    await supabaseAdmin
      .from('user_migration_status')
      .upsert(migrationStatusData, { onConflict: 'user_id' });

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
          failed,
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
