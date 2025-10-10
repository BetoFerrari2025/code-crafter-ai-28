import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    console.log('Received messages:', messages);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Você é um gerador de código HTML especializado.

IMPORTANTE: Gere APENAS HTML puro, CSS e JavaScript vanilla. NUNCA use React ou JSX.

Regras CRÍTICAS:
1. Retorne APENAS código HTML válido e completo
2. SEMPRE comece com <!DOCTYPE html>
3. Use Tailwind CSS via CDN
4. Inclua JavaScript vanilla quando necessário (dentro de <script>)
5. NÃO use React, JSX, TypeScript, imports ou exports
6. O código deve funcionar diretamente no navegador
7. NÃO inclua explicações, APENAS código
8. Use cores vibrantes e design moderno

Estrutura obrigatória:
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>App</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    /* CSS customizado aqui */
  </style>
</head>
<body class="bg-gray-50">
  <!-- Conteúdo HTML aqui -->
  
  <script>
    // JavaScript vanilla aqui
  </script>
</body>
</html>

Exemplo de calculadora:
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Calculadora</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-4">
  <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
    <div class="bg-gray-900 text-white text-right p-6 rounded-lg mb-4 text-3xl font-mono">0</div>
    <div class="grid grid-cols-4 gap-3">
      <button class="bg-gray-200 hover:bg-gray-300 p-6 rounded-lg text-xl font-semibold">7</button>
      <button class="bg-gray-200 hover:bg-gray-300 p-6 rounded-lg text-xl font-semibold">8</button>
      <!-- mais botões -->
    </div>
  </div>
  <script>
    // Lógica da calculadora
  </script>
</body>
</html>`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');
    
    const generatedCode = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ code: generatedCode }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-code function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
