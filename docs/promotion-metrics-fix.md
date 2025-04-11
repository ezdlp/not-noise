# Promotion Metrics Synchronization Fix

## Issue
The promotions dashboard was not correctly showing metrics (approval rate, submissions, approved tracks) for delivered campaigns. The metrics were being stored in the `campaign_result_data` table when uploading CSV results, but were not being copied to the main `promotions` table for display in the dashboard.

## Solution

### 1. Updated Edge Function
Modified the `process-campaign-results` Edge Function to update the promotion record with metrics when marking a campaign as delivered:

```typescript
// Update the campaign status and metrics
await supabaseAdmin
  .from('promotions')
  .update({ 
    status: 'delivered', 
    updated_at: new Date().toISOString(),
    // Update the metrics fields from the calculated stats
    approval_count: approved,
    submission_count: totalSubmissions,
    estimated_streams: approved * 250
  })
  .eq('id', campaignId)
```

### 2. Updated Dashboard Display
Changed the promotions dashboard to display consistent metrics matching the campaign detail page:

- Submissions
- Approval Rate (calculated from approved / submissions)
- Approved (number of approved tracks)
- Est. Streams (estimated streams from approvals)

### 3. Migration Script
Created a script to update existing delivered campaigns with metrics from their result data:

```bash
# Run the migration script for existing campaigns
node scripts/update-promotion-metrics.js
```

## Deployment

1. Deploy the updated Edge Function:
```bash
npx supabase functions deploy process-campaign-results
```

2. Run the migration script with appropriate environment variables:
```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
node scripts/update-promotion-metrics.js
```

## Additional Notes

- The metrics calculation logic is consistent for both:
  - Approval Rate = (approved ÷ total submissions) × 100%
  - Estimated Streams = approved × 250

- For campaigns without result data, the dashboard will show default values (0 for counts, 0.0% for rates) 