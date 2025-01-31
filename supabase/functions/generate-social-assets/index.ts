import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { smartLinkId, platform, artworkUrl, title, artistName } = await req.json();
    console.log("Generating asset for:", { smartLinkId, platform, artworkUrl, title, artistName });

    // Create HTML template
    const template = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
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
              box-sizing: border-box;
            }
            .artwork {
              width: 500px;
              height: 500px;
              border-radius: 8px;
              margin-bottom: 40px;
              box-shadow: 0 4px 60px rgba(0, 0, 0, 0.2);
            }
            .title {
              font-size: 48px;
              font-weight: 700;
              text-align: center;
              margin: 0 0 16px;
              max-width: 800px;
            }
            .artist {
              font-size: 32px;
              font-weight: 500;
              opacity: 0.9;
            }
          </style>
        </head>
        <body>
          <img src="${artworkUrl}" class="artwork" crossorigin="anonymous" />
          <h1 class="title">${title}</h1>
          <p class="artist">${artistName}</p>
        </body>
      </html>
    `;

    // Return the template with proper headers
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