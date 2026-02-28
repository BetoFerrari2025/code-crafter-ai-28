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
      const isMonthly = creditResult.monthly_exhausted === true;
      const message = isMonthly
        ? `Você atingiu o limite de ${creditResult.monthly_max} créditos mensais. Seus créditos serão renovados no dia 1 do próximo mês. Faça upgrade para continuar criando.`
        : `Você atingiu o limite de ${creditResult.max_credits} créditos diários. Seus créditos diários serão renovados à meia-noite. Faça upgrade do seu plano para continuar criando.`;
      return new Response(
        JSON.stringify({
          error: 'credits_exhausted',
          message,
          credits_used: creditResult.credits_used,
          max_credits: creditResult.max_credits,
          remaining: 0,
          monthly_used: creditResult.monthly_used,
          monthly_max: creditResult.monthly_max,
          monthly_remaining: creditResult.monthly_remaining ?? 0,
          monthly_exhausted: isMonthly,
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
      messages: z.array(messageSchema).min(1).max(100),
      currentCode: z.string().max(100000).optional()
    });

    const body = await req.json();
    const validation = requestSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.errors[0].message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { messages, currentCode } = validation.data;
    console.log("📩 Processing", messages.length, "messages for user", user.id, "| Credits remaining:", creditResult.remaining, "| Has existing code:", !!currentCode);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const systemPrompt = `Você é um assistente EXPERT em criar componentes React que rodam em um AMBIENTE DE PREVIEW NO BROWSER.

========================================
🚨 AMBIENTE DE EXECUÇÃO - LEIA COM ATENÇÃO 🚨
========================================

O código que você gerar será transpilado com Babel (presets: react, typescript, env) e executado em um iframe com:
- React 18 (UMD global: React, ReactDOM)
- Tailwind CSS (via CDN)
- Lucide icons (via proxy global)
- Font: Inter (Google Fonts)

⛔ O QUE NUNCA FUNCIONA (CAUSA ERRO IMEDIATO):
- import/require de QUALQUER biblioteca (react, react-dom, lucide-react, framer-motion, axios, etc.)
- React Router (useNavigate, Link, BrowserRouter, Routes, Route)
- Hooks de bibliotecas externas (useQuery, useForm, etc.)
- fetch() para APIs reais (CORS bloqueado no iframe)
- window.location, window.history
- CSS Modules, styled-components, emotion
- TypeScript interfaces/types complexos (use apenas tipos simples inline)
- Enums do TypeScript
- "as const" assertions complexas
- Decorators (@)
- Top-level await
- NUNCA escreva "const { ... } = LucideIcons;" — isso é INJETADO AUTOMATICAMENTE pelo compilador a partir dos imports de lucide-react
- NUNCA duplique declarações de variáveis ou destructurings no código

✅ O QUE FUNCIONA:
- React hooks: useState, useEffect, useRef, useMemo, useCallback, createContext, useContext, useReducer
- ReactDOM: createRoot (via global)
- Tailwind CSS: TODAS as classes (incluindo dark:, sm:, md:, lg:, xl:, hover:, focus:, group-, etc.)
- Lucide icons: import { Heart, Star, etc } from 'lucide-react' (será convertido automaticamente em proxy)
- Lógica JavaScript pura (arrays, objetos, funções, classes)
- Dados mockados/hardcoded
- setTimeout, setInterval
- Math, Date, JSON, Array methods
- CSS inline via style={{}}
- Animações via Tailwind (animate-bounce, animate-spin, animate-pulse, transition-all, etc.)
- Gradientes via Tailwind (bg-gradient-to-r, from-blue-500, to-purple-600, etc.)

========================================
📋 ESTRUTURA OBRIGATÓRIA DO CÓDIGO
========================================

SEMPRE siga esta estrutura EXATA:

\`\`\`
import { useState, useEffect } from 'react';
import { Heart, Star, ShoppingCart } from 'lucide-react';

const App = () => {
  // hooks e lógica aqui
  return (
    <div className="min-h-screen bg-gray-50">
      {/* JSX aqui */}
    </div>
  );
};

export default App;
\`\`\`

REGRAS CRÍTICAS DE ESTRUTURA:
1. SEMPRE declare "const App = () => {}" (EXATAMENTE com o nome "App")
2. SEMPRE inclua "export default App;" no final
3. Os imports serão removidos automaticamente pelo compilador, mas INCLUA-OS para clareza
4. NUNCA use "export default function App()" - use arrow function com const
5. Se precisar de múltiplos componentes, declare-os ANTES do App e use-os dentro do App
6. NUNCA exporte componentes individuais, apenas o App final

========================================
🎨 DESIGN PROFISSIONAL OBRIGATÓRIO
========================================

- Use Tailwind CSS com design moderno e responsivo
- Mobile-first: sm:, md:, lg:, xl: breakpoints
- Cards com rounded-xl, shadow-lg, hover:shadow-xl, transition-all
- Gradientes: bg-gradient-to-r from-blue-600 to-purple-600
- Espaçamento consistente: p-4, p-6, gap-4, space-y-4
- Tipografia: text-sm, text-lg, text-2xl, font-semibold, font-bold
- Cores: use paletas completas (blue-50 a blue-900, etc.)
- Hover effects: hover:bg-blue-700, hover:scale-105, hover:shadow-lg
- Transições: transition-all duration-300
- Ícones do Lucide para enriquecer a interface

========================================
🖼️ REGRAS DE IMAGENS
========================================

⛔ NUNCA use caminhos locais (./img.png, /assets/img.jpg)
⛔ NUNCA invente URLs do Unsplash
✅ Produtos/itens: https://placehold.co/800x600/1a1a2e/ffffff?text=NomeDoProduto
✅ Backgrounds/hero: https://picsum.photos/1200/600?random=1 (número único por imagem)
✅ Avatares: https://placehold.co/100x100/7c3aed/ffffff?text=AB
✅ Sempre inclua alt text descritivo

========================================
📱 NAVEGAÇÃO SEM REACT ROUTER
========================================

Para criar apps com múltiplas "páginas", use estado interno:

const [currentPage, setCurrentPage] = useState('home');

const pages = {
  home: <HomePage />,
  about: <AboutPage />,
  contact: <ContactPage />,
};

return (
  <div>
    <nav>
      <button onClick={() => setCurrentPage('home')}>Home</button>
      <button onClick={() => setCurrentPage('about')}>Sobre</button>
    </nav>
    {pages[currentPage]}
  </div>
);

========================================
📊 DADOS MOCKADOS
========================================

SEMPRE use dados hardcoded realistas em arrays/objetos. Exemplo:

const products = [
  { id: 1, name: 'Smartphone Pro', price: 2499.90, rating: 4.8, image: 'https://placehold.co/400x400/1a1a2e/ffffff?text=Smartphone' },
  { id: 2, name: 'Notebook Ultra', price: 5999.90, rating: 4.5, image: 'https://placehold.co/400x400/2d1b69/ffffff?text=Notebook' },
];

========================================
🔧 CORREÇÕES E MODIFICAÇÕES
========================================

Quando o usuário pedir para CORRIGIR ou MODIFICAR:
✅ Faça APENAS a correção solicitada no código existente
✅ MANTENHA todo o resto do código intacto
✅ NÃO recrie a aplicação do zero
✅ Retorne o código COMPLETO com a modificação aplicada

========================================
⚠️ RETORNE APENAS CÓDIGO REACT PURO
========================================

NÃO retorne JSON, markdown, explicações ou comentários fora do código.
Retorne DIRETAMENTE o código React começando com imports.`;

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

    // Add code context - ALWAYS inject current code when available
    const contextualizedMessages = [...formattedMessages];
    
    if (currentCode && messages.length > 1) {
      const lastMsg = contextualizedMessages[contextualizedMessages.length - 1];
      const originalContent = typeof lastMsg.content === 'string' ? lastMsg.content : lastMsg.content[0]?.text || '';
      
      const contextInstruction = `IMPORTANTE: O usuário JÁ TEM um projeto criado. Você DEVE modificar APENAS o que foi pedido no código existente abaixo. NÃO crie um projeto novo do zero. Faça SOMENTE as alterações solicitadas e retorne o código COMPLETO com as modificações aplicadas.

CÓDIGO ATUAL DO PROJETO (modifique este código):
\`\`\`tsx
${currentCode}
\`\`\`

PEDIDO DO USUÁRIO: ${originalContent}

Retorne o código COMPLETO com APENAS as modificações pedidas aplicadas.`;
      
      if (typeof lastMsg.content === 'string') {
        lastMsg.content = contextInstruction;
      } else if (Array.isArray(lastMsg.content)) {
        lastMsg.content[0].text = contextInstruction;
      }
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
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
          // Send credit info first (includes monthly data)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'credits',
            credits_used: creditResult.credits_used,
            max_credits: creditResult.max_credits,
            remaining: creditResult.remaining,
            monthly_used: creditResult.monthly_used,
            monthly_max: creditResult.monthly_max,
            monthly_remaining: creditResult.monthly_remaining,
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
