
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current user session to verify admin status
    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
    
    if (!roles?.length) {
      throw new Error('Admin access required')
    }

    const { action, userData } = await req.json()
    
    if (action === 'check') {
      const { emails } = userData
      if (!Array.isArray(emails)) {
        throw new Error('Invalid request format')
      }

      // Get existing users
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      })

      if (listError) throw listError

      const existingEmails = new Set(existingUsers.users.map(u => u.email?.toLowerCase()))
      const results = emails.map(email => ({
        email,
        exists: existingEmails.has(email.toLowerCase())
      }))

      return new Response(
        JSON.stringify({ results }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    } else if (action === 'create') {
      const { email, password, metadata } = userData
      
      // Create user with admin API
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: metadata
      })

      if (createError) throw createError

      if (newUser.user) {
        // Add user role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: newUser.user.id,
            role: 'user'
          })

        if (roleError) throw roleError
      }

      return new Response(
        JSON.stringify({ user: newUser.user }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    throw new Error('Invalid action')

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
