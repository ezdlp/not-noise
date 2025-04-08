/**
 * This script tests the campaign results API endpoint directly
 * Run with: node scripts/test-api-endpoint.js
 */

const fetch = require('node-fetch');

// Replace with actual values from your environment
const API_URL = 'https://soundraiser.io/api/admin/process-campaign-results';
const TEST_CAMPAIGN_ID = 'REPLACE_WITH_ACTUAL_CAMPAIGN_ID'; // Replace with a real campaign ID
const TEST_FILE_PATH = 'REPLACE_WITH_ACTUAL_FILE_PATH'; // Replace with a real file path

// Optional: Include a real auth token if needed
// const AUTH_TOKEN = 'REPLACE_WITH_ACTUAL_AUTH_TOKEN';

async function testApiEndpoint() {
  console.log(`Testing API endpoint: ${API_URL}`);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Uncomment if authentication is needed
        // 'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify({
        campaignId: TEST_CAMPAIGN_ID,
        filePath: TEST_FILE_PATH
      })
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    const contentType = response.headers.get('content-type');
    console.log(`Content-Type: ${contentType}`);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('Response text:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
    }
  } catch (error) {
    console.error('Error testing API endpoint:', error);
  }
}

testApiEndpoint(); 