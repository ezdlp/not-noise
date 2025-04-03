import { useState } from 'react';
import { useSupabaseMCP } from '@/hooks/useSupabaseMCP';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Database } from 'lucide-react';

/**
 * Component to display the Supabase MCP connection status
 * This is for admin/dashboard use only as it accesses the MCP client
 */
export function SupabaseMCPStatus() {
  const { supabaseMCP, isConnected, isLoading, error, isConfigured } = useSupabaseMCP();
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  // Function to test a simple database query
  async function testDatabaseQuery() {
    if (!isConnected) return;
    
    try {
      setTesting(true);
      setTestResult(null);
      
      // Simple test query to app_config table
      const { data, error } = await supabaseMCP
        .from('app_config')
        .select('*')
        .limit(5);
      
      if (error) {
        throw error;
      }
      
      setTestResult({ success: true, data });
    } catch (err) {
      setTestResult({ 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center space-x-2">
        <Database className="h-5 w-5" />
        <h2 className="text-lg font-medium">Supabase MCP Status</h2>
      </div>
      
      {/* Connection Status */}
      {isLoading ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Checking connection...</AlertTitle>
          <AlertDescription>
            Verifying connection to Supabase MCP...
          </AlertDescription>
        </Alert>
      ) : !isConfigured ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Configured</AlertTitle>
          <AlertDescription>
            Supabase MCP is not configured. Please run <code>npm run supabase:setup-mcp</code> to configure it.
          </AlertDescription>
        </Alert>
      ) : isConnected ? (
        <Alert variant="default" className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle>Connected</AlertTitle>
          <AlertDescription>
            Successfully connected to Supabase MCP.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            {error?.message || 'Failed to connect to Supabase MCP'}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Test Connection Button */}
      <div className="flex items-center space-x-4">
        <Button 
          onClick={testDatabaseQuery}
          disabled={!isConnected || testing}
          className="mt-2"
        >
          {testing ? 'Running Test...' : 'Test Database Query'}
        </Button>
        
        <Button 
          variant="outline"
          onClick={() => window.location.reload()}
          className="mt-2"
        >
          Refresh Status
        </Button>
      </div>
      
      {/* Test Results */}
      {testResult && (
        <div className="mt-4 p-4 bg-slate-50 rounded-md">
          <h3 className="font-medium mb-2">Test Results:</h3>
          {testResult.success ? (
            <div>
              <p className="text-green-600 mb-2">✅ Query successful!</p>
              <pre className="bg-slate-100 p-2 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(testResult.data, null, 2)}
              </pre>
            </div>
          ) : (
            <div>
              <p className="text-red-600 mb-2">❌ Query failed:</p>
              <pre className="bg-slate-100 p-2 rounded text-xs overflow-auto">
                {testResult.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 