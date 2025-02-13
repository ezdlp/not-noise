
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://soundraiser.io',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400', // 24 hours cache for preflight requests
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

const BATCH_SIZE = 25; // Process users in batches
const DELAY_BETWEEN_EMAILS = 200; // 200ms delay between emails to avoid rate limiting

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processUserBatch(users: { id: string; email: string }[]) {
  const results = [];
  
  for (const user of users) {
    try {
      console.log(`Processing reset email for user: ${user.email}`);
      
      // Generate reset link
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: user.email,
      });

      if (error) {
        console.error(`Error generating reset link for ${user.email}:`, error);
        results.push({ email: user.email, success: false, error: error.message });
        
        // Update migration status
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
        console.log(`Successfully generated reset link for ${user.email}`);
        results.push({ email: user.email, success: true });
        
        // Update migration status
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

      // Add delay between emails
      await sleep(DELAY_BETWEEN_EMAILS);
    } catch (error) {
      console.error(`Unexpected error for ${user.email}:`, error);
      results.push({ email: user.email, success: false, error: error.message });
      
      // Update migration status
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
      status: 204 // Successful preflight should return 204
    });
  }

  try {
    // Get all users with emails from profiles
    const { data: users, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .not('email', 'is', null);

    if (fetchError) {
      throw new Error(`Error fetching users: ${fetchError.message}`);
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Found ${users.length} users to process`);

    // Initialize migration status for all users
    const migrationStatusData = users.map(user => ({
      user_id: user.id,
      email: user.email,
      status: 'pending',
    }));

    await supabaseAdmin
      .from('user_migration_status')
      .upsert(migrationStatusData, { onConflict: 'user_id' });

    // Process users in batches
    const results = [];
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(users.length / BATCH_SIZE)}`);
      const batchResults = await processUserBatch(batch);
      results.push(...batchResults);
    }

    // Calculate summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        message: "Password reset process completed",
        summary: {
          total: results.length,
          successful,
          failed,
        },
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
