const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://owtufhdsuuyrgmxytclj.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminRole() {
  try {
    // Check user_roles table for the specific user
    const { data: roles, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', 'f5791e4d-f9d4-4b25-bd64-f7424d3e10bc');
    
    if (error) {
      console.error('Error checking roles:', error);
      return;
    }
    
    console.log('User roles:', roles);
    
    // Check if any of the roles is 'admin'
    const isAdmin = roles.some(role => role.role === 'admin');
    console.log('Is admin:', isAdmin);
    
    // Also check the has_role function
    const { data: hasRoleResult, error: hasRoleError } = await supabase.rpc('has_role', {
      _role: 'admin'
    });
    
    if (hasRoleError) {
      console.error('Error checking has_role:', hasRoleError);
      return;
    }
    
    console.log('has_role function result:', hasRoleResult);
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkAdminRole(); 