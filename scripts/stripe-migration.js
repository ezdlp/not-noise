// Stripe Migration Script
// This script pulls data from Stripe API and copies it to our custom tables
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

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
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-client-info': 'stripe-migration-script',
      },
    },
  }
);

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('custom_stripe_customers').select('id', { count: 'exact', head: true });
    
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

async function migrateStripeData() {
  console.log('🔄 Starting Stripe data migration...');
  
  // Test connection first
  const connectionOk = await testSupabaseConnection();
  if (!connectionOk) {
    console.error('❌ Aborting migration due to connection issues');
    return;
  }
  
  try {
    // 1. Migrate customers
    console.log('Migrating customers...');
    const customers = await stripe.customers.list({ limit: 100 });
    
    for (const customer of customers.data) {
      try {
        console.log(`Processing customer: ${customer.id}`);
        const { data, error } = await supabase
          .from('custom_stripe_customers')
          .upsert({
            id: customer.id,
            email: customer.email,
            name: customer.name,
            description: customer.description,
            created: customer.created,
            metadata: customer.metadata,
            last_updated: new Date().toISOString()
          }, { onConflict: 'id' });
        
        if (error) {
          console.error(`❌ Error upserting customer ${customer.id}:`, error);
          throw new Error(`Error upserting customer ${customer.id}: ${error.message}`);
        }
      } catch (customerError) {
        console.error(`❌ Caught error processing customer ${customer.id}:`, customerError);
        throw customerError;
      }
    }
    console.log(`✅ Migrated ${customers.data.length} customers`);
    
    // 2. Migrate products
    console.log('Migrating products...');
    const products = await stripe.products.list({ limit: 100 });
    
    for (const product of products.data) {
      const { data, error } = await supabase
        .from('custom_stripe_products')
        .upsert({
          id: product.id,
          name: product.name,
          active: product.active,
          description: product.description,
          last_updated: new Date().toISOString()
        }, { onConflict: 'id' });
      
      if (error) {
        throw new Error(`Error upserting product ${product.id}: ${error.message}`);
      }
    }
    console.log(`✅ Migrated ${products.data.length} products`);
    
    // 3. Migrate prices
    console.log('Migrating prices...');
    const prices = await stripe.prices.list({ limit: 100 });
    
    for (const price of prices.data) {
      const { data, error } = await supabase
        .from('custom_stripe_prices')
        .upsert({
          id: price.id,
          product: price.product,
          active: price.active,
          currency: price.currency,
          unit_amount: price.unit_amount,
          type: price.type,
          recurring: price.recurring,
          metadata: price.metadata,
          last_updated: new Date().toISOString()
        }, { onConflict: 'id' });
      
      if (error) {
        throw new Error(`Error upserting price ${price.id}: ${error.message}`);
      }
    }
    console.log(`✅ Migrated ${prices.data.length} prices`);
    
    // 4. Migrate subscriptions
    console.log('Migrating subscriptions...');
    const subscriptions = await stripe.subscriptions.list({ limit: 100 });
    
    for (const subscription of subscriptions.data) {
      const { data, error } = await supabase
        .from('custom_stripe_subscriptions')
        .upsert({
          id: subscription.id,
          customer: subscription.customer,
          status: subscription.status,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end,
          last_updated: new Date().toISOString()
        }, { onConflict: 'id' });
      
      if (error) {
        throw new Error(`Error upserting subscription ${subscription.id}: ${error.message}`);
      }
    }
    console.log(`✅ Migrated ${subscriptions.data.length} subscriptions`);
    
    // 5. Migrate invoices
    console.log('Migrating invoices...');
    const invoices = await stripe.invoices.list({ limit: 100 });
    
    for (const invoice of invoices.data) {
      const { data, error } = await supabase
        .from('custom_stripe_invoices')
        .upsert({
          id: invoice.id,
          customer: invoice.customer,
          subscription: invoice.subscription,
          status: invoice.status,
          total: invoice.total,
          currency: invoice.currency,
          period_start: invoice.period_start,
          period_end: invoice.period_end,
          lines: invoice.lines.data,
          last_updated: new Date().toISOString()
        }, { onConflict: 'id' });
      
      if (error) {
        throw new Error(`Error upserting invoice ${invoice.id}: ${error.message}`);
      }
    }
    console.log(`✅ Migrated ${invoices.data.length} invoices`);
    
    // 6. Migrate charges
    console.log('Migrating charges...');
    const charges = await stripe.charges.list({ limit: 100 });
    
    for (const charge of charges.data) {
      const { data, error } = await supabase
        .from('custom_stripe_charges')
        .upsert({
          id: charge.id,
          customer: charge.customer,
          amount: charge.amount,
          amount_refunded: charge.amount_refunded,
          currency: charge.currency,
          created: charge.created,
          status: charge.status,
          payment_method_details: charge.payment_method_details,
          metadata: charge.metadata,
          description: charge.description,
          last_updated: new Date().toISOString()
        }, { onConflict: 'id' });
      
      if (error) {
        throw new Error(`Error upserting charge ${charge.id}: ${error.message}`);
      }
    }
    console.log(`✅ Migrated ${charges.data.length} charges`);
    
    // Verify the migration
    await verifyMigration();
    
    console.log('🎉 Stripe data migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Verify the migration was successful
async function verifyMigration() {
  console.log('Verifying migration results...');
  
  const tables = [
    'custom_stripe_customers',
    'custom_stripe_products',
    'custom_stripe_prices',
    'custom_stripe_subscriptions',
    'custom_stripe_invoices',
    'custom_stripe_charges'
  ];
  
  for (const table of tables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('id', { count: 'exact' });
    
    if (error) {
      console.error(`❌ Error verifying ${table}:`, error);
    } else {
      console.log(`✅ ${table}: ${count} rows`);
    }
  }
}

// Handle pagination if there are more than 100 records
async function migrateAllPages() {
  // Implementation for pagination if needed
  // This would make multiple API calls with the 'starting_after' parameter
}

// Run the migration
migrateStripeData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  }); 