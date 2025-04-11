# Promotion Metrics Synchronization Fix

## Issue
The promotions dashboard was not correctly showing metrics (approval rate, submissions, approved tracks) for delivered campaigns. The metrics were being stored in the `campaign_result_data` table when uploading CSV results, but were not being copied to the main `promotions` table for display in the dashboard.

## Solution

### 1. Database Schema Update
Added required columns to the promotions table:

```sql
ALTER TABLE public.promotions
ADD COLUMN IF NOT EXISTS approval_count INTEGER DEFAULT 0;

ALTER TABLE public.promotions
ADD COLUMN IF NOT EXISTS estimated_streams INTEGER DEFAULT 0;
```

### 2. Edge Function Update
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

### 3. Data Migration
Applied SQL migration to update existing delivered campaigns:

```sql
DO $$
DECLARE
  campaign_rec RECORD;
  result_rec RECORD;
  approved_count INTEGER;
  total_submissions INTEGER;
  est_streams INTEGER;
BEGIN
  -- Loop through all delivered campaigns
  FOR campaign_rec IN 
    SELECT id, track_name, track_artist
    FROM public.promotions
    WHERE status = 'delivered'
  LOOP
    -- Get latest result data for this campaign
    SELECT stats
    INTO result_rec
    FROM public.campaign_result_data
    WHERE campaign_id = campaign_rec.id
    ORDER BY processed_at DESC
    LIMIT 1;
    
    -- If result data found, update the campaign
    IF result_rec.stats IS NOT NULL THEN
      approved_count := COALESCE((result_rec.stats->>'approved')::INTEGER, 0);
      total_submissions := COALESCE((result_rec.stats->>'totalSubmissions')::INTEGER, 0);
      est_streams := approved_count * 250;
      
      -- Update the campaign
      UPDATE public.promotions
      SET 
        approval_count = approved_count,
        submission_count = total_submissions,
        estimated_streams = est_streams
      WHERE id = campaign_rec.id;
    END IF;
  END LOOP;
END $$;
```

### 4. Dashboard Display Update
Changed the promotions dashboard to display consistent metrics matching the campaign detail page:

- Submissions (from `submission_count`)
- Approval Rate (calculated from `approval_count / submission_count`)
- Approved (from `approval_count`)
- Est. Streams (from `estimated_streams`)

## Next Steps

### 1. Deploy the Edge Function
When Docker is available, deploy the updated function:

```bash
npx supabase functions deploy process-campaign-results
```

### 2. Verify Functionality 
For any new campaign deliveries, verify that metrics are properly populated in the dashboard view.

## Implementation Notes

- The metrics calculation logic is consistent between the campaign detail page and dashboard:
  - Approval Rate = (approved ÷ total submissions) × 100%
  - Estimated Streams = approved × 250

- The dashboard has been updated to display 4 key metrics instead of showing the price, which provides a more useful view of campaign performance. 