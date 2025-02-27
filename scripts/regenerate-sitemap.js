
#!/usr/bin/env node

// A simple script to manually trigger sitemap regeneration

const https = require('https');

// You should replace this with your actual API key
const API_KEY = process.env.SITEMAP_API_KEY || 'change-this-to-a-secure-key';

const options = {
  hostname: 'owtufhdsuuyrgmxytclj.supabase.co',
  port: 443,
  path: '/functions/v1/regenerate-sitemap',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY
  }
};

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsedData = JSON.parse(data);
      console.log('Response:', parsedData);
      
      if (parsedData.success) {
        console.log(`✅ Sitemap successfully regenerated with ${parsedData.url_count} URLs`);
      } else {
        console.error('❌ Failed to regenerate sitemap:', parsedData.error);
      }
    } catch (e) {
      console.error('Failed to parse response:', e);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(JSON.stringify({
  source: 'manual',
  timestamp: new Date().toISOString()
}));

req.end();

console.log('🔄 Regenerating sitemap...');
