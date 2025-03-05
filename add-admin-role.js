const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and service role key (not anon key)
const supabaseUrl = 'https://owtufhdsuuyrgmxytclj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseKey);
const userId = 'f5791e4d-f9d4-4b25-bd64-f7424d3e10bc';

async function addAdminRole() {
  try {
    // First check if the user already has an admin role
    const { data: existingRoles, error: checkError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin');
    
    if (checkError) {
      console.error('Error checking existing roles:', checkError);
      return;
    }
    
    console.log('Existing admin roles:', existingRoles);
    
    // If user doesn't have admin role, add it
    if (!existingRoles || existingRoles.length === 0) {
      const { data: insertResult, error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'admin'
        });
      
      if (insertError) {
        console.error('Error adding admin role:', insertError);
        return;
      }
      
      console.log('Admin role added successfully');
    } else {
      console.log('User already has admin role');
    }
    
    // Verify the role was added
    const { data: verifyRoles, error: verifyError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);
    
    if (verifyError) {
      console.error('Error verifying roles:', verifyError);
      return;
    }
    
    console.log('Current user roles:', verifyRoles);
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

addAdminRole(); 