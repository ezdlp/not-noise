
// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.com/manual/examples/deploy_api
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Log all request information for debugging
  const userAgent = req.headers.get('user-agent') || 'No User-Agent'
  const url = new URL(req.url)
  const acceptLanguage = req.headers.get('accept-language')
  const isWhatsApp = userAgent.includes('WhatsApp') || 
                      userAgent.toLowerCase().includes('whatsapp') ||
                      /WhatsApp\/[0-9\.]+ [AIN]/.test(userAgent)
  
  // Log all headers for debugging
  const headersLog: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    headersLog[key] = value
  })
  
  // Prepare response data
  const responseData = {
    timestamp: new Date().toISOString(),
    userAgent,
    isWhatsAppDetected: isWhatsApp,
    url: req.url,
    method: req.method,
    headers: headersLog,
    queryParams: Object.fromEntries(url.searchParams),
    message: "WhatsApp Debug Endpoint",
    info: "This endpoint helps debug WhatsApp crawler issues"
  }
  
  console.log('WhatsApp Debug Request:', JSON.stringify(responseData, null, 2))
  
  // WhatsApp-optimized HTML response - simpler meta tags at the very top of head
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta property="og:site_name" content="Soundraiser">
<meta property="og:title" content="WhatsApp Debug">
<meta property="og:description" content="Debugging WhatsApp link previews">
<meta property="og:image" content="https://soundraiser.io/lovable-uploads/soundraiser-logo/Logo A.png">
<meta property="og:url" content="${req.url}">
<meta property="og:type" content="website">
<title>WhatsApp Debug Info</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <h1>WhatsApp Debug Info</h1>
  <p>User Agent: ${userAgent}</p>
  <p>WhatsApp Crawler Detected: ${isWhatsApp ? 'Yes' : 'No'}</p>
  <p>Request Time: ${new Date().toISOString()}</p>
  <pre>${JSON.stringify(responseData, null, 2)}</pre>
</body>
</html>`

  return new Response(html, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  })
})
