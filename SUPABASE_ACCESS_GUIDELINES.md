# Supabase Access Guidelines

## Database Access Rules

1. **Always use MCP for Database Queries**
   - All database queries MUST be made through the MCP query tool
   - Example correct usage: `mcp__query` with SQL statements
   - NEVER attempt to access the database through any other means

2. **Read-Only Connection**
   - The MCP connection to Supabase is READ-ONLY
   - It can only be used for SELECT queries and information gathering
   - It CANNOT be used for any write operations (INSERT, UPDATE, DELETE, ALTER, etc.)

3. **Write Operations Protocol**
   - For any database modifications:
     - Provide the complete SQL code to the user
     - Explain the purpose and expected outcome of each SQL statement
     - The user will run these statements manually in the Supabase dashboard SQL editor

4. **SQL Best Practices**
   - Write clear, well-formatted SQL with appropriate comments
   - Test read operations through MCP before suggesting write operations
   - Always consider database schema and relationships when crafting queries

## Example Workflow

**Read Operation (Performed through MCP):**
```
SELECT * FROM smart_links LIMIT 5;
```

**Write Operation (Provide to user):**
```sql
-- Update the analytics function to fix timestamp handling
CREATE OR REPLACE FUNCTION get_improved_analytics_stats(
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS TABLE (
  -- Function body here
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Function implementation here
END;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION get_improved_analytics_stats TO authenticated;
```

## Reminder

These guidelines ensure database integrity and security. Following them prevents unintentional data modifications and maintains a clear separation between read and write operations. 