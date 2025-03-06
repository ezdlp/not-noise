# Analytics Function Fix

## Issue Description

The analytics page in the admin section (control-room/analytics) was failing to load due to SQL errors in the `get_improved_analytics_stats` function. The errors were:

1. `"column reference \"email_capture_enabled\" is ambiguous"`
2. `"column reference \"day\" is ambiguous"`

These occurred because:
- The column `email_capture_enabled` exists in the `smart_links` table and is also used as an output column name in the function
- The column `day` is used in multiple places in the query and in the UNION ALL operation
- The SQL query was referencing these columns without proper table qualification, causing ambiguity

## Fix Applied

Two migration files have been created to fix these issues:

### 1. `20250306000000_fix_analytics_column_ambiguity.sql`

- Updates the `get_improved_analytics_stats` function to properly qualify the `email_capture_enabled` column with table aliases
- Adds table aliases (`sl`) to the `smart_links` table in both the current and previous period queries
- Explicitly references the column as `sl.email_capture_enabled` to avoid ambiguity

### 2. `20250306000001_fix_day_column_ambiguity.sql`

- Further updates the function to fix the ambiguous `day` column reference
- Adds subquery aliases (`curr` and `prev`) to properly qualify the day column in the UNION ALL operation
- References the day column as `curr.day` and `prev.day` to avoid ambiguity

## How to Apply the Fix

To apply these fixes to your Supabase instance:

1. Make sure you have the Supabase CLI installed
2. Navigate to the project root directory
3. Run the following command to apply the migrations:

```bash
supabase db push
```

This will apply the new migrations to your Supabase database.

## Verification

After applying the fixes, you should:

1. Refresh the analytics page in the admin section
2. Verify that the data loads correctly without errors
3. Check that all charts and metrics are displaying properly

If you continue to experience issues, please check the browser console for any additional error messages.

## Additional Notes

These fixes maintain all the existing functionality of the analytics function while resolving the column ambiguity issues. No changes to the frontend code were required as the function signature and return values remain the same. 