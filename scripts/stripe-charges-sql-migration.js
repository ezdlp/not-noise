// Direct SQL Migration Script for Stripe Charges using MCP
// Exports Stripe charges as SQL that can be run directly via MCP

import * as dotenv from 'dotenv';
import Stripe from 'stripe';
import * as fs from 'fs';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Log configuration
console.log('Configuration:');
console.log(`- Stripe API Key: ${process.env.VITE_STRIPE_SECRET_KEY ? '✅ Set' : '❌ Missing'}`);

// Initialize Stripe with API key
const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia'
});

// Function to escape SQL strings
function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

// Function to convert a JavaScript object to JSONB
function toJsonb(obj) {
  if (obj === null || obj === undefined) return 'NULL';
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
}

// Generate SQL insert statements for charges
async function generateChargeSql() {
  console.log('🔄 Starting Stripe charges SQL generation...');
  
  try {
    // Create SQL file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `stripe-charges-migration-${timestamp}.sql`;
    const sqlStream = fs.createWriteStream(filename);
    
    // Write SQL header with transaction
    sqlStream.write('BEGIN;\n\n');
    sqlStream.write('-- Clear existing data (optional - remove if you want to preserve existing data)\n');
    sqlStream.write('TRUNCATE TABLE custom_stripe_charges;\n\n');
    sqlStream.write('-- Insert charge data from Stripe\n');
    
    // Get charges from Stripe with pagination
    let hasMore = true;
    let startingAfter = null;
    let totalCharges = 0;
    
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
      
      // Generate INSERT statements for each charge
      for (const charge of charges.data) {
        // Convert timestamp to SQL timestamp format
        const createdDate = new Date(charge.created * 1000).toISOString();
        
        const sql = `INSERT INTO custom_stripe_charges (
  id, amount, currency, customer, description, 
  invoice, payment_intent, status, created, attrs, last_updated
) VALUES (
  ${escapeSql(charge.id)},
  ${charge.amount || 'NULL'},
  ${escapeSql(charge.currency)},
  ${escapeSql(charge.customer)},
  ${escapeSql(charge.description)},
  ${escapeSql(charge.invoice)},
  ${escapeSql(charge.payment_intent)},
  ${escapeSql(charge.status)},
  ${escapeSql(createdDate)},
  ${toJsonb(charge.metadata)},
  NOW()
);\n`;
        
        sqlStream.write(sql);
        totalCharges++;
        
        // Save the last ID for pagination
        startingAfter = charge.id;
      }
      
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
    
    // Write SQL footer
    sqlStream.write('\nCOMMIT;\n');
    sqlStream.end();
    
    console.log(`🎉 SQL generation complete! ${totalCharges} charges exported to ${filename}`);
    console.log('Run this SQL file using MCP to migrate the data.');
    
  } catch (error) {
    console.error('❌ SQL generation failed:', error);
  }
}

// Run the SQL generation
generateChargeSql()
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error during SQL generation:', error);
    process.exit(1);
  }); 