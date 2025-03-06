# How to Find Your Supabase API Keys

Follow these steps to find your Supabase API keys:

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Select your project
3. Go to "Project Settings" (gear icon in the bottom left)
4. Click on "API" in the sidebar
5. You'll see two API keys:
   - **anon public**: This is for client-side code (less privileged)
   - **service_role**: This is for server-side code (more privileged)

For our connection test, we need the **service_role** key since we're trying to access database functions.

## Update Your .env File

Once you have your API keys, update your `.env` file with the following content:

```
# Supabase Connection
SUPABASE_URL=https://owtufhdsuuyrgmxytclj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Replace `your-service-role-key-here` with the actual service_role key from your Supabase dashboard.

## Run the Connection Test Again

After updating your `.env` file, run the connection test again:

```
node scripts/supabase-connect.js
```

This should now successfully connect to your Supabase project and list the available functions. 