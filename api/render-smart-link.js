// Import the og-preview module
const ogPreview = require('./og-preview');

module.exports = async (req, res) => {
  console.log('Render Smart Link API: Forwarding to OG preview handler');
  
  // Forward the request to the og-preview handler
  return ogPreview(req, res);
}; 