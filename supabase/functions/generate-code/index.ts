/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'unauthorized', message: 'Token de autenticação necessário.' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get user from token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'unauthorized', message: 'Sessão inválida.' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check credits using service role (SECURITY DEFINER function)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: creditResult, error: creditError } = await adminClient.rpc('check_and_use_credit', {
      p_user_id: user.id,
    });

    if (creditError) {
      console.error("❌ Credit check error:", creditError);
      throw new Error('Erro ao verificar créditos');
    }

    if (!creditResult.allowed) {
      return new Response(
        JSON.stringify({
          error: 'credits_exhausted',
          message: `Você atingiu o limite de ${creditResult.max_credits} créditos diários. Faça upgrade do seu plano para continuar criando.`,
          credits_used: creditResult.credits_used,
          max_credits: creditResult.max_credits,
          remaining: 0,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate input
    const messageSchema = z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1).max(10000),
      images: z.array(z.string()).max(10).optional()
    });

    const requestSchema = z.object({
      messages: z.array(messageSchema).min(1).max(100)
    });

    const body = await req.json();
    const validation = requestSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.errors[0].message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { messages } = validation.data;
    console.log("📩 Processing", messages.length, "messages for user", user.id, "| Credits remaining:", creditResult.remaining);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const systemPrompt = `Você é um assistente de desenvolvimento especializado em criar aplicações React PROFISSIONAIS, MODERNAS e VISUALMENTE IMPRESSIONANTES.

IMPORTANTE: Quando o usuário enviar imagens, analise-as cuidadosamente e crie código React que reflita o design, layout e estrutura mostrados nas imagens.

🔧 REGRA CRÍTICA DE CORREÇÕES E MODIFICAÇÕES:
========================================
⚠️ Quando o usuário pedir para CORRIGIR, MODIFICAR ou AJUSTAR algo:
✅ SEMPRE faça apenas a correção/modificação solicitada no código existente
✅ MANTENHA todo o resto do código intacto
✅ NÃO recrie a aplicação inteira do zero
✅ NÃO ignore o código anterior que foi fornecido

========================================
🚨 REGRA CRÍTICA DE IMAGENS 🚨
========================================

⛔ NUNCA use caminhos locais ou blob URLs
✅ SEMPRE use URLs HTTPS do Unsplash: https://images.unsplash.com/photo-[ID]?w=800

========================================
REGRA CRÍTICA: RETORNE APENAS CÓDIGO REACT
========================================

⚠️ NUNCA retorne JSON ou markdown code blocks!
⚠️ Retorne APENAS código React/JavaScript puro e válido!

CORRETO ✅:
import React from 'react';
const App = () => { return <div>...</div>; };
export default App;

ERRADO ❌: \`\`\`jsx ... \`\`\`
ERRADO ❌: { "type": "code", "code": "..." }

========================================
DESIGN PROFISSIONAL OBRIGATÓRIO
========================================

🎨 Use Tailwind CSS com design moderno, responsivo, cards elegantes, gradientes, hover effects e animações.
📱 Mobile-first com breakpoints sm:, md:, lg:, xl:
🖼️ Imagens: APENAS URLs HTTPS do Unsplash com ?w=800

Se há código anterior: EDITE mantendo todo código existente
Se é novo: Crie do zero seguindo as regras de design

SEMPRE retorne o código completo e funcional do componente React.`;

    // Format messages for multimodal support
    const formattedMessages = messages.map((msg: any) => {
      if (msg.images && msg.images.length > 0) {
        const content: any[] = [{ type: 'text', text: msg.content }];
        msg.images.forEach((imageData: string) => {
          content.push({ type: 'image_url', image_url: { url: imageData } });
        });
        return { role: msg.role, content };
      }
      return { role: msg.role, content: msg.content };
    });

    // Add code context for corrections
    const contextualizedMessages = [...formattedMessages];
    let currentCode = '';
    for (let i = messages.length - 2; i >= 0; i--) {
      if (messages[i].role === 'assistant' || messages[i].content?.includes('import React')) {
        currentCode = messages[i].content || '';
        break;
      }
    }

    if (currentCode && messages.length > 1) {
      const lastMsg = contextualizedMessages[contextualizedMessages.length - 1];
      const originalContent = typeof lastMsg.content === 'string' ? lastMsg.content : lastMsg.content[0]?.text || '';
      if (/(corrija|corrige|ajusta|ajuste|modifica|modifique|mude|altere|conserte|conserta|arruma|arrume)/i.test(originalContent)) {
        if (typeof lastMsg.content === 'string') {
          lastMsg.content = `${originalContent}\n\nCÓDIGO ATUAL QUE DEVE SER MODIFICADO:\n\`\`\`tsx\n${currentCode}\n\`\`\`\n\nLembre-se: MODIFIQUE APENAS o que foi pedido!`;
        } else if (Array.isArray(lastMsg.content)) {
          lastMsg.content[0].text = `${originalContent}\n\nCÓDIGO ATUAL QUE DEVE SER MODIFICADO:\n\`\`\`tsx\n${currentCode}\n\`\`\`\n\nLembre-se: MODIFIQUE APENAS o que foi pedido!`;
        }
      }
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'system', content: systemPrompt }, ...contextualizedMessages],
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ AI API error:", response.status, errorText);
      
      // Return error as SSE stream so client can handle it properly
      const encoder = new TextEncoder();
      const errorStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'credits',
            credits_used: creditResult.credits_used,
            max_credits: creditResult.max_credits,
            remaining: creditResult.remaining,
          })}\n\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: 'Erro temporário na IA. Tente novamente em alguns segundos.',
          })}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        }
      });
      
      return new Response(errorStream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Stream SSE response with credit info in first chunk
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send credit info first
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'credits',
            credits_used: creditResult.credits_used,
            max_credits: creditResult.max_credits,
            remaining: creditResult.remaining,
          })}\n\n`));

          const reader = response.body?.getReader();
          if (!reader) throw new Error('No reader');

          let buffer = '';
          let generatedCode = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += new TextDecoder().decode(value);
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim() || line.startsWith(':')) continue;
              if (!line.startsWith('data: ')) continue;

              const data = line.slice(6);
              if (data === '[DONE]') {
                // Clean and send the final code
                let cleanCode = generatedCode
                  .replace(/```(?:jsx|tsx|javascript|typescript|react)?\n?/g, '')
                  .replace(/```\n?/g, '')
                  .trim();

                if (cleanCode.length > 0) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'code', code: cleanCode })}\n\n`));
                } else {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'A IA não retornou código válido. Tente reformular seu pedido.' })}\n\n`));
                }
                controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                controller.close();
                return;
              }

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  generatedCode += delta;
                  let status = 'Pensando...';
                  if (generatedCode.includes('import')) status = '📦 Importando bibliotecas...';
                  if (generatedCode.includes('const') || generatedCode.includes('function')) status = '🔧 Criando componentes...';
                  if (generatedCode.includes('className')) status = '🎨 Estilizando interface...';
                  if (generatedCode.includes('return')) status = '✨ Finalizando estrutura...';
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status })}\n\n`));
                }
              } catch (e) {
                // Ignore parse errors for individual chunks
              }
            }
          }

          // If we got here without [DONE], flush whatever we have
          if (generatedCode.length > 0) {
            let cleanCode = generatedCode
              .replace(/```(?:jsx|tsx|javascript|typescript|react)?\n?/g, '')
              .replace(/```\n?/g, '')
              .trim();
            
            if (cleanCode.length > 0) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'code', code: cleanCode })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Erro durante a geração. Tente novamente.' })}\n\n`));
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();
          } catch {
            // Controller may already be closed
          }
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error("💥 Erro no generate-code:", error);
    // Return error as SSE stream for consistency
    const encoder = new TextEncoder();
    const errorStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : 'Erro interno. Tente novamente.',
        })}\n\n`));
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      }
    });
    
    return new Response(errorStream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  }
});
