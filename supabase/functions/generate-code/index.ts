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

    const systemPrompt = `Você é um assistente de desenvolvimento especializado em React + TypeScript + Tailwind CSS.

ANÁLISE DE INTENÇÃO (CRÍTICO):

1. É um COMANDO DE GERAÇÃO/EDIÇÃO?
   Exemplos válidos:
   - "Crie um site de venda de carros"
   - "Faça um dashboard"
   - "Adicione um botão azul"
   - "Corrija as imagens"
   - "Crie uma calculadora"
   - Qualquer frase com verbos de ação
   
2. É apenas uma PERGUNTA ou CONVERSA?
   Exemplos que NÃO devem gerar código:
   - Letras isoladas: "d", "a", "x"
   - Respostas curtas: "ok", "sim", "não"
   - Saudações: "olá", "oi"
   - Perguntas gerais

REGRAS CRÍTICAS:
- Mensagem com menos de 3 palavras SEM verbo de ação = CONVERSA
- Mensagem sem sentido claro = CONVERSA
- Apenas gere código quando houver INTENÇÃO CLARA de criar/editar

FORMATO DE RESPOSTA (JSON PURO, SEM MARKDOWN):

Para COMANDOS:
{
  "type": "code",
  "message": "Código gerado com sucesso!",
  "code": "import React from 'react'..."
}

Para CONVERSAS:
{
  "type": "message",
  "message": "Sua resposta aqui",
  "code": null
}

IMPORTANTE: Retorne APENAS JSON puro, SEM code blocks markdown.

CONTEXTO E EDIÇÃO:
- Se há mensagens anteriores com código: EDITE o código existente
- NÃO crie novo projeto se já existe código
- MANTENHA todo código anterior ao editar
- Aplique APENAS as modificações pedidas

QUALIDADE DE DESIGN:
- Use Tailwind CSS com classes modernas
- Gradientes, sombras, bordas arredondadas
- Layout responsivo com Grid/Flexbox
- Tipografia clara com Google Fonts
- Paletas de cores harmoniosas

IMAGENS (CRÍTICO):
NUNCA use imagens locais:
- ./imagem.png ❌
- /src/assets/img.jpg ❌
- import foto from '@/assets/foto.jpg' ❌

SEMPRE use URLs públicas HTTPS:
- https://images.unsplash.com/photo-xxx ✅
- https://source.unsplash.com/800x600/?tema ✅
- https://picsum.photos/800/600 ✅

URLs por tema:
- Carros: https://images.unsplash.com/photo-1542362567-b07e54358753?w=800
- Tecnologia: https://images.unsplash.com/photo-1518770660439-4636190af475?w=800
- Comida: https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800

Para múltiplas imagens, use IDs diferentes.

CHECKLIST:
- Identifiquei corretamente: é CÓDIGO ou CONVERSA?
- Retornei JSON válido sem markdown?
- Design é PROFISSIONAL e MODERNO?
- TODAS imagens são URLs públicas HTTPS?
- Se é edição: mantive TODO código anterior?`;

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
    
    let aiResponse = data.choices[0].message.content;
    console.log('Raw AI response:', aiResponse);
    
    // Remover markdown code blocks se existirem
    aiResponse = aiResponse
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    
    console.log('Cleaned AI response:', aiResponse);
    
    // Tentar fazer parse do JSON retornado pela IA
    try {
      const parsedResponse = JSON.parse(aiResponse);
      console.log('Parsed response type:', parsedResponse.type);
      
      // Validar se é um formato esperado
      if (!parsedResponse.type || !['code', 'message'].includes(parsedResponse.type)) {
        throw new Error('Invalid response type');
      }
      
      return new Response(
        JSON.stringify(parsedResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (parseError) {
      // Se não for JSON válido, assumir que é código e retornar no formato esperado
      console.error('Failed to parse AI response as JSON:', parseError);
      console.log('Response is not valid JSON, treating as raw code');
      return new Response(
        JSON.stringify({ 
          type: 'code',
          message: 'Código gerado!',
          code: aiResponse 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
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
