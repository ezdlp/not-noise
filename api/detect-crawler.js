// API endpoint for detecting crawler/bot user agents
// This helps diagnose how different social media platforms identify themselves

export default function handler(req, res) {
  const userAgent = req.headers['user-agent'] || '';
  
  // Known bot patterns to check for
  const botPatterns = [
    { name: 'Facebook', regex: /facebook|facebookexternalhit/i },
    { name: 'Twitter', regex: /twitter|twitterbot/i },
    { name: 'LinkedIn', regex: /linkedin|linkedinbot/i },
    { name: 'Pinterest', regex: /pinterest|pinterestbot/i },
    { name: 'Google', regex: /google|googlebot/i },
    { name: 'Bing', regex: /bing|bingbot/i },
    { name: 'Yahoo', regex: /yahoo|slurp/i },
    { name: 'Yandex', regex: /yandex|yandexbot/i },
    { name: 'WhatsApp', regex: /whatsapp/i },
    { name: 'Telegram', regex: /telegram|telegrambot/i },
    { name: 'Generic Bot', regex: /bot|crawler|spider/i }
  ];
  
  // Test against all bot patterns
  const matchedBots = botPatterns
    .filter(bot => bot.regex.test(userAgent))
    .map(bot => bot.name);
  
  // Determine if this is a bot based on all tests
  const isBot = matchedBots.length > 0;
  
  // Parse the URL being requested
  const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const path = url.pathname;
  const format = url.searchParams.get('format') || 'json';
  
  // Log the request for analytics
  console.log(`[Crawler Detection] UA: ${userAgent.substring(0, 100)}`);
  console.log(`[Crawler Detection] Bot: ${isBot}, Matches: ${matchedBots.join(', ')}`);
  
  // Return the results in the requested format
  if (format === 'html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Crawler Detection Results</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .result {
            background-color: ${isBot ? '#e7f5ff' : '#f8f9fa'};
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .matches {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 10px;
          }
          .bot-match {
            background-color: #6851FB;
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
          }
          pre {
            background-color: #f1f1f1;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
          }
        </style>
      </head>
      <body>
        <h1>Crawler Detection Results</h1>
        
        <div class="result">
          <h2>Detection Result: ${isBot ? 'Bot Detected' : 'Not a Bot'}</h2>
          
          ${matchedBots.length > 0 ? `
            <h3>Matched Patterns:</h3>
            <div class="matches">
              ${matchedBots.map(bot => `<span class="bot-match">${bot}</span>`).join('')}
            </div>
          ` : ''}
        </div>
        
        <h3>User Agent:</h3>
        <pre>${userAgent}</pre>
        
        <h3>Request Details:</h3>
        <pre>Path: ${path}
Host: ${req.headers.host || 'unknown'}
Time: ${new Date().toISOString()}</pre>
        
        <p><a href="${url.pathname}?format=json">View as JSON</a></p>
      </body>
      </html>
    `);
  }
  
  // Default JSON response
  return res.status(200).json({
    isBot,
    matchedBots,
    userAgent,
    requestPath: path,
    requestHost: req.headers.host || 'unknown',
    timestamp: new Date().toISOString()
  });
} 