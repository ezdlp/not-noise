// Test Supabase API access
import * as dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Setup axios for Supabase
const supabaseApi = axios.create({
  baseURL: process.env.VITE_SUPABASE_URL,
  headers: {
    'apikey': process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${process.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  }
});

async function testApi() {
  console.log('Testing Supabase API access...');
  
  try {
    // Test fetching the test table
    console.log('Fetching from test_migration table...');
    try {
      const response = await supabaseApi.get('/rest/v1/test_migration?limit=10');
      console.log('✅ Test table fetch successful!');
      console.log('Data:', response.data);
    } catch (error) {
      console.error('❌ Test table fetch failed:', error.response?.data || error.message);
    }
    
    // Try to list all tables
    console.log('\nListing all tables...');
    try {
      // List all tables via information_schema
      const response = await supabaseApi.get('/rest/v1/information_schema/tables?select=table_name&limit=20&table_schema=eq.public');
      console.log('✅ Table list successful!');
      console.log('Tables:', response.data.map(t => t.table_name).join(', '));
    } catch (error) {
      console.error('❌ Table list failed:', error.response?.data || error.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testApi()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error during test:', error);
    process.exit(1);
  }); 