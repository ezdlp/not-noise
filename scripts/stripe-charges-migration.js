// Stripe Charges Migration Script
import * as dotenv from 'dotenv';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Log configuration (without sensitive data)
console.log('Configuration:');
console.log(`- Stripe API Key: ${process.env.VITE_STRIPE_SECRET_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`- Supabase URL: ${process.env.VITE_SUPABASE_URL}`);
console.log(`- Supabase Service Role Key: ${process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);

// Initialize Stripe with API key
const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia'
});

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('custom_stripe_charges').select('id', { head: true });
    
    if (error) {
      console.error('❌ Supabase connection error:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return false;
  }
}

async function migrateStripeCharges() {
  console.log('🔄 Starting Stripe charges migration...');
  
  // Test connection first
  const connectionOk = await testSupabaseConnection();
  if (!connectionOk) {
    console.error('❌ Aborting migration due to connection issues');
    return;
  }
  
  try {
    // Get charges from Stripe with pagination
    let hasMore = true;
    let startingAfter = null;
    let totalMigrated = 0;
    
    while (hasMore) {
      console.log(`Fetching charges${startingAfter ? ' after ' + startingAfter : ''}...`);
      
      const options = { 
        limit: 50 
      };
      
      if (startingAfter) {
        options.starting_after = startingAfter;
      }
      
      const charges = await stripe.charges.list(options);
      console.log(`Retrieved ${charges.data.length} charges from Stripe`);
      
      // Track success and failures for summary
      let batchSuccesses = 0;
      let batchFailures = 0;
      
      // Process charges in batches to avoid overloading the API
      for (const charge of charges.data) {
        try {
          console.log(`Processing charge: ${charge.id}`);
          
          // Convert timestamp to ISO string
          const createdDate = new Date(charge.created * 1000).toISOString();
          
          const { error } = await supabase
            .from('custom_stripe_charges')
            .upsert({
              id: charge.id,
              amount: charge.amount,
              currency: charge.currency,
              customer: charge.customer,
              description: charge.description,
              invoice: charge.invoice,
              payment_intent: charge.payment_intent,
              status: charge.status,
              created: createdDate,
              attrs: charge.metadata || {},
              last_updated: new Date().toISOString()
            });
          
          if (error) {
            console.error(`❌ Error migrating charge ${charge.id}:`, error);
            batchFailures++;
          } else {
            console.log(`✅ Successfully migrated charge ${charge.id}`);
            batchSuccesses++;
            totalMigrated++;
          }
        } catch (chargeError) {
          console.error(`❌ Error processing charge ${charge.id}:`, chargeError);
          batchFailures++;
        }
        
        // Save the last ID for pagination
        startingAfter = charge.id;
      }
      
      console.log(`Batch complete: ${batchSuccesses} succeeded, ${batchFailures} failed`);
      
      // Check if there are more charges to fetch
      hasMore = charges.has_more;
      
      if (charges.data.length === 0 || !hasMore) {
        console.log('No more charges to fetch.');
        hasMore = false;
      }
      
      // Add a small delay to avoid rate limiting
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`🎉 Migration complete! ${totalMigrated} charges successfully migrated.`);
    
    // Verify migration
    await verifyMigration();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

async function verifyMigration() {
  console.log('Verifying migration...');
  
  try {
    // Count records in the custom table
    const { data, error, count } = await supabase
      .from('custom_stripe_charges')
      .select('id', { count: 'exact' });
    
    if (error) {
      console.error('❌ Error verifying migration:', error);
    } else {
      console.log(`✅ Found ${count} charges in the database`);
    }
    
    // Check a few sample records for data quality
    const { data: sampleData, error: sampleError } = await supabase
      .from('custom_stripe_charges')
      .select('*')
      .limit(3);
    
    if (sampleError) {
      console.error('❌ Error retrieving sample data:', sampleError);
    } else if (sampleData.length > 0) {
      console.log('Sample data (first 3 records):');
      sampleData.forEach(charge => {
        console.log(`- ${charge.id}: ${charge.amount / 100} ${charge.currency.toUpperCase()} (${charge.status})`);
      });
    }
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

// Run the migration
migrateStripeCharges()
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  }); 