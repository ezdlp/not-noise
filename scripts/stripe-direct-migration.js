// Stripe Direct Migration Script
// This script pulls data from Stripe API and copies it to our custom tables using direct REST API calls
import * as dotenv from 'dotenv';
import Stripe from 'stripe';
import axios from 'axios';

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

// Setup axios for Supabase
const supabaseApi = axios.create({
  baseURL: process.env.VITE_SUPABASE_URL,
  headers: {
    'apikey': process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${process.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
});

// Helper function to insert data into a Supabase table
async function insertIntoTable(tableName, data) {
  try {
    const response = await supabaseApi.post(`/rest/v1/${tableName}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error inserting into ${tableName}:`, error.response?.data || error.message);
    throw error;
  }
}

async function migrateData() {
  console.log('🔄 Starting Stripe data migration...');
  
  try {
    // 1. Test connection
    console.log('Testing connection...');
    try {
      const response = await supabaseApi.get('/rest/v1/custom_stripe_customers?limit=1');
      console.log('✅ Connection test successful!');
    } catch (error) {
      console.error('❌ Connection test failed:', error.response?.data || error.message);
      return;
    }
    
    // 2. Migrate a test customer first
    console.log('Migrating test customer...');
    const testCustomerData = {
      id: 'test_migration_customer',
      email: 'test@migration.com',
      name: 'Test Migration',
      description: 'Used to test migration script',
      created: Math.floor(Date.now() / 1000),
      last_updated: new Date().toISOString()
    };
    
    try {
      await insertIntoTable('custom_stripe_customers', testCustomerData);
      console.log('✅ Test customer migration successful!');
    } catch (error) {
      console.error('❌ Test customer migration failed. Aborting.');
      return;
    }
    
    // 3. Migrate real customers
    console.log('Migrating customers...');
    const customers = await stripe.customers.list({ limit: 5 }); // Starting with just 5 for testing
    
    for (const customer of customers.data) {
      try {
        console.log(`Processing customer: ${customer.id}`);
        const customerData = {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          description: customer.description,
          created: customer.created,
          metadata: customer.metadata,
          last_updated: new Date().toISOString()
        };
        
        await insertIntoTable('custom_stripe_customers', customerData);
        console.log(`✅ Customer ${customer.id} migrated successfully`);
      } catch (error) {
        console.error(`❌ Failed to migrate customer ${customer.id}. Continuing with next.`);
      }
    }
    
    console.log(`✅ Completed migration of ${customers.data.length} customers`);
    
    // 4. Verify migration
    console.log('Verifying migration...');
    try {
      const response = await supabaseApi.get('/rest/v1/custom_stripe_customers?select=count');
      console.log(`✅ Found ${response.data.length} customers in the database`);
    } catch (error) {
      console.error('❌ Verification failed:', error.response?.data || error.message);
    }
    
    console.log('🎉 Migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
migrateData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  }); 