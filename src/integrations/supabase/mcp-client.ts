import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * MCP Supabase client for direct database access
 * 
 * This client is configured to use the service role key which bypasses RLS policies.
 * Use with caution and ONLY in server-side code or admin-protected functions.
 */

// Use environment variables from the MCP
const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'owtufhdsuuyrgmxytclj';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Handle missing configuration gracefully
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('WARNING: Missing SUPABASE_SERVICE_ROLE_KEY. MCP database access will be limited.');
}

export const isConfigured = !!SUPABASE_SERVICE_ROLE_KEY;

/**
 * Supabase admin client with service role permissions
 * CAUTION: This bypasses Row Level Security!
 */
export const supabaseMCP = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-client-info': 'soundraiser-mcp-client',
      },
    },
  }
);

/**
 * Check if the MCP Supabase connection is properly configured and working
 */
export async function testMCPConnection() {
  if (!isConfigured) {
    console.error('Supabase MCP not configured. Missing service role key.');
    return false;
  }

  try {
    const { data, error } = await supabaseMCP
      .from('app_config')
      .select('key')
      .limit(1);
    
    if (error) {
      console.error('Supabase MCP connection error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Supabase MCP connection error:', error);
    return false;
  }
}

// Export a function to access the MCP client with connection verification
export function getMCPClient() {
  if (!isConfigured) {
    throw new Error('Supabase MCP not configured. Missing service role key.');
  }
  return supabaseMCP;
} 