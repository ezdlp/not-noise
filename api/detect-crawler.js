// API endpoint for detecting crawler/bot user agents
// This helps diagnose how different social media platforms identify themselves

export default function handler(req, res) {
  const userAgent = req.headers['user-agent'] || '';
  
  // Common bot patterns
  const botPatterns = [
    { name: 'Facebook', regex: /facebook|facebookexternalhit/i },
    { name: 'Twitter', regex: /twitter|twitterbot/i },
    { name: 'LinkedIn', regex: /linkedin|linkedinbot/i },
    { name: 'Pinterest', regex: /pinterest|pinterestbot/i },
    { name: 'Google', regex: /google|googlebot/i },
    { name: 'Bing', regex: /bing|bingbot/i },
    { name: 'Bot', regex: /bot|crawler|spider/i }
  ];
  
  // Test the user agent against each pattern
  const matchedBots = botPatterns
    .filter(bot => bot.regex.test(userAgent))
    .map(bot => bot.name);
    
  const isBot = matchedBots.length > 0;
  
  // Get format from query parameter
  const format = req.query.format || 'json';
  
  // Log for debugging
  console.log(`[Detect Crawler] UA: ${userAgent.substring(0, 100)}`);
  console.log(`[Detect Crawler] Is Bot: ${isBot}, Matches: ${matchedBots.join(', ')}`);
  
  // Return HTML or JSON based on format parameter
  if (format === 'html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bot Detection Result</title>
        <style>
          body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .result { background: ${isBot ? '#e7f5ff' : '#f8f9fa'}; padding: 20px; border-radius: 8px; }
          .bot { background: #6851FB; color: white; padding: 5px 10px; border-radius: 4px; margin: 5px; display: inline-block; }
        </style>
      </head>
      <body>
        <h1>Bot Detection Results</h1>
        <div class="result">
          <h2>Is Bot: ${isBot ? 'YES' : 'NO'}</h2>
          ${matchedBots.length > 0 ? `
            <h3>Matched Patterns:</h3>
            <div>${matchedBots.map(bot => `<span class="bot">${bot}</span>`).join('')}</div>
          ` : ''}
          <h3>User Agent:</h3>
          <pre>${userAgent}</pre>
        </div>
      </body>
      </html>
    `);
  }
  
  // Default JSON response
  return res.status(200).json({
    isBot,
    matchedBots,
    userAgent
  });
} 