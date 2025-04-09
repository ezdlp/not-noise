# Process Campaign Results Function

This Edge Function processes CSV files for Spotify playlist promotion campaign results, extracts valid submissions, and generates AI analysis of curator feedback.

## Recent Updates

The function has been updated to fix several issues with the way CSV data is processed:

1. **Fixed Submission Count**: Now only counts rows with status `approved`, `shared`, or `declined` as valid submissions
2. **Unified Approved/Shared Status**: Treats "shared" status the same as "approved" for consistency
3. **De-duplicated Curators**: Prevents the same curator appearing multiple times with different statuses
4. **Improved Playlist Links**: Preserves playlist links for approved curators
5. **Enhanced Actionable Points**: Updated ChatGPT instructions to provide more detailed and valuable suggestions for artists

## How to Deploy

1. Navigate to the Supabase Dashboard at https://app.supabase.com
2. Select the project: "ezdlp's Project"
3. Go to Edge Functions in the left sidebar
4. Find the "process-campaign-results" function
5. Click "Edit code"
6. Replace the entire code with the content of this file
7. Click "Deploy" to update the function

## Function Details

This function:
- Takes a CSV file containing campaign results
- Filters and processes the results to get accurate counts
- De-duplicates curator entries by name
- Standardizes statuses (normalizing "shared" to "Approved")
- Generates AI analysis of the feedback
- Stores the processed results in the database

## Testing

After deployment, you can test the function by uploading a CSV file through the admin dashboard. 