/**
 * Update Promotion Metrics Script
 * 
 * This script finds all delivered campaigns and updates their metrics
 * by retrieving data from the campaign_result_data table.
 */

import { createClient } from '@supabase/supabase-js';
import process from 'process';

// Supabase connection initialization (credentials will be taken from .env)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const updatePromotionMetrics = async () => {
  console.log('Starting promotion metrics update...');
  
  try {
    // Check if a specific campaign ID was provided as a command-line argument
    const specificCampaignId = process.argv[2];
    
    let query = supabase.from('promotions')
      .select('id, track_name, track_artist')
      .eq('status', 'delivered');
    
    // If a specific campaign ID was provided, filter by that
    if (specificCampaignId) {
      console.log(`Targeting specific campaign ID: ${specificCampaignId}`);
      query = query.eq('id', specificCampaignId);
    }
    
    // Execute the query
    const { data: deliveredPromotions, error: promotionsError } = await query;
    
    if (promotionsError) {
      throw new Error(`Error fetching delivered promotions: ${promotionsError.message}`);
    }
    
    console.log(`Found ${deliveredPromotions.length} delivered promotions to process`);
    
    // 2. Process each campaign
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const promotion of deliveredPromotions) {
      try {
        console.log(`Processing promotion ID: ${promotion.id} - ${promotion.track_name} by ${promotion.track_artist}`);
        
        // 3. Get campaign results data
        const { data: resultsData, error: resultsError } = await supabase
          .from('campaign_result_data')
          .select('stats')
          .eq('campaign_id', promotion.id)
          .order('processed_at', { ascending: false })
          .limit(1)
          .single();
        
        if (resultsError) {
          console.warn(`No results found for promotion ${promotion.id}, skipping...`);
          continue;
        }
        
        const stats = resultsData?.stats;
        if (!stats) {
          console.warn(`No stats available for promotion ${promotion.id}, skipping...`);
          continue;
        }
        
        // 4. Extract metrics from stats
        const { approved, totalSubmissions, approvalRate } = stats;
        
        // 5. Update the promotion record
        const { error: updateError } = await supabase
          .from('promotions')
          .update({
            approval_count: approved || 0,
            submission_count: totalSubmissions || 0,
            estimated_streams: (approved || 0) * 250
          })
          .eq('id', promotion.id);
        
        if (updateError) {
          throw new Error(`Error updating promotion ${promotion.id}: ${updateError.message}`);
        }
        
        console.log(`✅ Updated metrics for promotion ${promotion.id}`);
        console.log(`   Submissions: ${totalSubmissions}, Approved: ${approved}, Approval Rate: ${approvalRate?.toFixed(1)}%`);
        updatedCount++;
      } catch (err) {
        console.error(`Failed to process promotion ${promotion.id}:`, err.message);
        errorCount++;
      }
    }
    
    console.log('\nUpdate summary:');
    console.log(`Total processed: ${deliveredPromotions.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Script failed:', error.message);
    process.exit(1);
  }
};

// Run the script
updatePromotionMetrics()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Uncaught error:', err);
    process.exit(1);
  }); 