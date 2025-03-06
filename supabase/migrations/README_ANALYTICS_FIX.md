# Analytics Function Fix

## Issue Description

The analytics page in the admin section (control-room/analytics) was experiencing several issues:

1. **Loading Error**: The page was failing to load due to SQL errors in the `get_improved_analytics_stats` function:
   - `"column reference \"email_capture_enabled\" is ambiguous"`
   - `"column reference \"day\" is ambiguous"`

2. **Incorrect Revenue Display**: 
   - Revenue numbers were not matching Stripe dashboard data
   - Currency was displayed in USD instead of EUR

3. **Missing Chart Tooltips**: Charts did not have proper tooltips

4. **Design Issues**: The UI did not follow the Soundraiser design system

## Fixes Applied

We've created several migration files to address these issues:

### 1. `20250306000000_fix_analytics_column_ambiguity.sql`

- Updates the `get_improved_analytics_stats` function to properly qualify the `email_capture_enabled` column with table aliases
- Adds table aliases (`sl`) to the `smart_links` table in both the current and previous period queries
- Explicitly references the column as `sl.email_capture_enabled` to avoid ambiguity

### 2. `20250306000001_fix_day_column_ambiguity.sql`

- Further updates the function to fix the ambiguous `day` column reference
- Adds subquery aliases (`curr` and `prev`) to properly qualify the day column in the UNION ALL operation
- References the day column as `curr.day` and `prev.day` to avoid ambiguity

### 3. `20250306000002_fix_revenue_calculation.sql`

- Updates the revenue calculation to use actual data from the Stripe charges table
- Changes revenue calculation from an estimate based on subscription tiers to actual transaction data
- Converts Stripe amounts from cents to euros (Stripe stores amounts in the smallest currency unit)

### 4. UI Improvements

- Updated the Analytics.tsx component to:
  - Format currency in EUR instead of USD
  - Add proper tooltips to all charts
  - Apply the Soundraiser design system (colors, spacing, typography, etc.)

## How to Apply the Fixes

To apply these fixes to your Supabase instance:

1. Make sure you have the Supabase CLI installed
2. Navigate to the project root directory
3. Run the following command to apply the migrations:

```bash
supabase db push
```

This will apply the new migrations to your Supabase database.

For the UI fixes, pull the latest code changes which include updates to the Analytics.tsx component.

## Verification

After applying the fixes, you should:

1. Refresh the analytics page in the admin section
2. Verify that the data loads correctly without errors
3. Check that revenue numbers match your Stripe dashboard and are displayed in euros
4. Confirm that charts have proper tooltips when hovering
5. Verify that the design follows the Soundraiser design system

## Additional Notes

These fixes maintain all the existing functionality of the analytics feature while addressing the specific issues. The revenue calculation now uses actual transaction data from Stripe, which should be more accurate than the previous estimation method. 