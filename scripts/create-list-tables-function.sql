-- Function to list all tables in the database
CREATE OR REPLACE FUNCTION list_all_tables()
RETURNS TABLE (
  schema_name TEXT,
  table_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    table_schema::TEXT as schema_name,
    table_name::TEXT
  FROM information_schema.tables
  WHERE table_schema IN ('public', 'auth')
    AND table_type = 'BASE TABLE'
  ORDER BY table_schema, table_name;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION list_all_tables TO authenticated; 