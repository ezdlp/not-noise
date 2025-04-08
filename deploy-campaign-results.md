# Deploying the Campaign Results Processor Edge Function

This guide explains how to deploy the `process-campaign-results` Edge Function to your Supabase project.

## Prerequisites

1. Supabase CLI installed
2. Logged in to your Supabase account via CLI
3. The project linked to your local environment

## Deployment Steps

1. First, make sure you have the Supabase CLI installed and you're logged in:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login
```

2. Link your project (if not already done):

```bash
supabase link --project-ref owtufhdsuuyrgmxytclj
```

3. Deploy the Edge Function:

```bash
supabase functions deploy process-campaign-results --project-ref owtufhdsuuyrgmxytclj
```

4. Set the necessary environment variables:

```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key --project-ref owtufhdsuuyrgmxytclj
```

5. Test the function:

You can test the Edge Function using curl:

```bash
curl -X POST 'https://owtufhdsuuyrgmxytclj.supabase.co/functions/v1/process-campaign-results' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"campaignId": "your-campaign-id", "filePath": "your-file-path"}'
```

## Troubleshooting

If you encounter issues, check the logs:

```bash
supabase functions logs process-campaign-results --project-ref owtufhdsuuyrgmxytclj
```

Common issues:
- Missing environment variables: Make sure OPENAI_API_KEY is set correctly
- Permissions: Ensure the function has proper permissions to access your Supabase tables
- File path: Make sure the file path provided to the function is correct

## Related Files

- `supabase/functions/process-campaign-results/index.ts` - The Edge Function code
- `supabase/functions/_shared/cors.ts` - CORS helper
- `src/pages/admin/components/CampaignResultsAnalyzer.tsx` - Frontend component that calls the function 