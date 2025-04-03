import { useState, useEffect } from 'react';
import { supabaseMCP, isConfigured, testMCPConnection } from '@/integrations/supabase/mcp-client';

/**
 * Hook for accessing the Supabase MCP client
 * 
 * This hook provides access to the Supabase MCP client and additional
 * connection status information. It should only be used in admin
 * or server components where elevated database access is required.
 * 
 * @returns {object} Supabase MCP client and connection status
 */
export function useSupabaseMCP() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Only try to connect if the client is configured
    if (!isConfigured) {
      setIsConnected(false);
      setIsLoading(false);
      setError(new Error('Supabase MCP client is not configured'));
      return;
    }

    async function checkConnection() {
      try {
        setIsLoading(true);
        const connected = await testMCPConnection();
        setIsConnected(connected);
        
        if (!connected) {
          setError(new Error('Failed to connect to Supabase MCP'));
        } else {
          setError(null);
        }
      } catch (err) {
        setIsConnected(false);
        setError(err instanceof Error ? err : new Error('Unknown error connecting to Supabase MCP'));
      } finally {
        setIsLoading(false);
      }
    }

    checkConnection();
  }, []);

  return {
    supabaseMCP,
    isConnected,
    isLoading,
    error,
    isConfigured
  };
} 