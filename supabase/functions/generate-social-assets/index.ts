import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { smartLinkId, platform, artworkUrl, title, artistName } = await req.json();
    console.log("Generating asset for:", { smartLinkId, platform, artworkUrl, title, artistName });

    // Create HTML template with proper styling and structure
    const template = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              margin: 0;
              font-family: 'Inter', sans-serif;
              width: 1080px;
              height: 1080px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background: #6851FB;
              color: white;
              padding: 40px;
            }
            .container {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 40px;
            }
            .artwork {
              width: 500px;
              height: 500px;
              border-radius: 8px;
              object-fit: cover;
              box-shadow: 0 4px 60px rgba(0, 0, 0, 0.2);
            }
            .title {
              font-size: 48px;
              font-weight: 700;
              text-align: center;
              margin: 0;
              max-width: 800px;
              line-height: 1.2;
            }
            .artist {
              font-size: 32px;
              font-weight: 500;
              opacity: 0.9;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <img 
              src="${artworkUrl}" 
              class="artwork" 
              crossorigin="anonymous" 
              referrerpolicy="no-referrer"
            />
            <h1 class="title">${title}</h1>
            <p class="artist">${artistName}</p>
          </div>
        </body>
      </html>
    `;

    return new Response(template, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 400,
    });
  }
});