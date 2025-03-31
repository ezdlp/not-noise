// api/test-bot.js - Simple endpoint to test bot detection
export default function handler(req, res) {
  const userAgent = req.headers['user-agent'] || '';
  const isBot = /facebook|twitter|bot|crawler|spider|linkedin|pinterest|whatsapp|telegram|slack|discord/i.test(userAgent);
  
  console.log(`[Test-Bot API] User-Agent: ${userAgent}`);
  console.log(`[Test-Bot API] Is Bot: ${isBot}`);
  
  return res.status(200).json({
    userAgent: userAgent,
    isBot: isBot,
    slug: req.query.slug || 'none',
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
} 