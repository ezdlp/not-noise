import dotenv from 'dotenv';
import pg from 'pg';

// Load environment variables
dotenv.config();

// Create a connection pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase connections
  }
});

async function testConnection() {
  let client;
  try {
    // Connect to the database
    client = await pool.connect();
    console.log('Successfully connected to Supabase database!');
    
    // Test a simple query
    const result = await client.query('SELECT current_timestamp');
    console.log('Current database time:', result.rows[0].current_timestamp);
    
    // List available functions
    console.log('\nListing available functions:');
    const functions = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_type = 'FUNCTION' 
      AND routine_schema = 'public'
      ORDER BY routine_name
    `);
    
    functions.rows.forEach(func => {
      console.log(`- ${func.routine_name}`);
    });
    
    console.log('\nConnection test completed successfully!');
  } catch (err) {
    console.error('Error connecting to the database:', err);
  } finally {
    // Release the client back to the pool
    if (client) client.release();
  }
  
  // Close the pool
  await pool.end();
}

testConnection(); 