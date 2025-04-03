# Supabase MCP Setup Guide

This guide explains how to configure and use the Supabase MCP (Model-Cursor-Protocol) integration in the Soundraiser application.

## What is Supabase MCP?

The Supabase MCP integration allows Cursor to connect directly to your Supabase database, enabling you to:

- Run SQL queries directly from Cursor
- Browse database schemas, tables, and data
- Execute complex operations with proper permissions
- Develop with real-time database access

## Setup Instructions

### 1. Configure Environment Variables

Ensure your `.env` file contains the following variables:

```
SUPABASE_PROJECT_REF=your_project_ref
SUPABASE_DB_PASSWORD=your_db_password
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_URL=https://your_project_ref.supabase.co
SUPABASE_ANON_KEY=your_anon_key
```

### 2. Run the Setup Script

Execute the following command to set up the MCP configuration:

```
npm run supabase:setup-mcp
```

This will create/update the `.cursor/mcp.json` file with the necessary configuration.

### 3. Restart Cursor

After setting up the configuration, restart Cursor to apply the changes.

### 4. Test the Connection

You can test the connection by running:

```
npm run supabase:test-connection
```

## Using the MCP Client in Code

### Example 1: Direct Import

```typescript
import { supabaseMCP, testMCPConnection } from '@/integrations/supabase/mcp-client';

async function fetchData() {
  const { data, error } = await supabaseMCP
    .from('your_table')
    .select('*')
    .limit(10);
    
  if (error) {
    console.error('Error:', error);
    return null;
  }
  
  return data;
}
```

### Example 2: Using the React Hook

```typescript
import { useSupabaseMCP } from '@/hooks/useSupabaseMCP';

function YourComponent() {
  const { supabaseMCP, isConnected, isLoading, error } = useSupabaseMCP();
  
  async function handleClick() {
    if (!isConnected) return;
    
    const { data, error } = await supabaseMCP
      .from('your_table')
      .select('*')
      .limit(10);
      
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log('Data:', data);
  }
  
  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error: {error.message}</p>
      ) : (
        <button onClick={handleClick} disabled={!isConnected}>
          Fetch Data
        </button>
      )}
    </div>
  );
}
```

### Example 3: Status Component

We've included a ready-to-use status component:

```typescript
import { SupabaseMCPStatus } from '@/components/admin/SupabaseMCPStatus';

function AdminDashboard() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <SupabaseMCPStatus />
      {/* Other admin components */}
    </div>
  );
}
```

## Security Considerations

- The MCP client uses the SERVICE_ROLE key which bypasses RLS policies
- Only use the MCP client in admin/protected routes or server-side code
- Never expose the SERVICE_ROLE key in client-side code or public repositories

## Troubleshooting

If you encounter connection issues:

1. Verify your `.env` file has the correct values
2. Check that the `.cursor/mcp.json` file was created correctly
3. Ensure you've restarted Cursor after making changes
4. Run `npm run supabase:test-connection` for detailed error information
5. Verify your Supabase project is active and accessible 