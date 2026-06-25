import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    // 1. Le serveur Supabase télécharge le script Paddle officiel
    const response = await fetch("https://cdn.paddle.com/paddle/v3/paddle.js");
    const scriptText = await response.text();

    // 2. On le renvoie au navigateur avec le bon type MIME et les droits CORS ouverts
    return new Response(scriptText, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Access-Control-Allow-Origin": "*", // Autorise toutes les requêtes (local et prod)
      },
    });
  } catch (error) {
    return new Response(`console.error("Erreur Proxy Paddle:", "${error.message}");`, {
      status: 500,
      headers: { "Content-Type": "application/javascript" },
    });
  }
})
