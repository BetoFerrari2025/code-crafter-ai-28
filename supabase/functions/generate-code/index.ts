/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input with zod schema
    const messageSchema = z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1, 'Content cannot be empty').max(10000, 'Content too long'),
      images: z.array(z.string()).max(10, 'Too many images').optional()
    });

    const requestSchema = z.object({
      messages: z.array(messageSchema).min(1, 'At least one message required').max(100, 'Too many messages')
    });

    const body = await req.json();
    const validation = requestSchema.safeParse(body);
    
    if (!validation.success) {
      console.error("❌ Validation error:", validation.error.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input',
          details: validation.error.errors[0].message 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    const { messages } = validation.data;
    // Sanitized logging - don't expose full message content
    console.log("📩 Processing", messages.length, "messages from user");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const systemPrompt = `Você é um assistente de desenvolvimento especializado em criar aplicações React PROFISSIONAIS, MODERNAS e VISUALMENTE IMPRESSIONANTES.

IMPORTANTE: Quando o usuário enviar imagens, analise-as cuidadosamente e crie código React que reflita o design, layout e estrutura mostrados nas imagens.

========================================
🚨 REGRA CRÍTICA DE IMAGENS - LEIA COM ATENÇÃO 🚨
========================================

⛔ NUNCA NUNCA NUNCA use:
❌ Caminhos locais: ./img.png, /assets/foto.jpg, ../images/produto.jpg
❌ URLs blob: blob:https://...
❌ Caminhos relativos de qualquer tipo
❌ Placeholders genéricos

✅ SEMPRE SEMPRE SEMPRE use URLs HTTPS do Unsplash:
✅ https://images.unsplash.com/photo-1234567890?w=800
✅ Use photo-ids DIFERENTES para cada imagem
✅ Adicione ?w=800 no final para otimizar
✅ Exemplo completo: https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800

========================================
REGRA CRÍTICA: RETORNE APENAS CÓDIGO REACT
========================================

⚠️ NUNCA retorne JSON!
⚠️ NUNCA use markdown code blocks!
⚠️ Retorne APENAS código React/JavaScript puro e válido!

CORRETO ✅:
import React from 'react';

const App = () => {
  return <div>...</div>;
};

export default App;

ERRADO ❌:
\`\`\`jsx
...
\`\`\`

ERRADO ❌:
{
  "type": "code",
  "code": "..."
}

========================================
DESIGN PROFISSIONAL OBRIGATÓRIO
========================================

🎨 ESTRUTURA MODERNA:
✅ Containers: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
✅ Grids responsivos: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6
✅ Espaçamento: space-y-8, gap-6

🃏 CARDS ELEGANTES:
✅ bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl
✅ Transições: transition-all duration-300
✅ Hover: hover:scale-105 transform cursor-pointer
✅ Padding: p-6

📝 TIPOGRAFIA IMPACTANTE:
✅ Títulos: text-4xl md:text-5xl lg:text-6xl font-bold
✅ Subtítulos: text-xl md:text-2xl font-semibold
✅ Corpo: text-base md:text-lg leading-relaxed

🎨 CORES VIBRANTES:
✅ Primary: cyan-500, blue-600, indigo-600, purple-600
✅ Gradientes: bg-gradient-to-r from-cyan-500 to-blue-600
✅ Badges: bg-cyan-500 text-white px-4 py-2 rounded-full font-bold

🖼️ IMAGENS ALTA QUALIDADE (REGRA OBRIGATÓRIA):
⚠️ CRÍTICO: Use APENAS URLs HTTPS completas do Unsplash
✅ Formato correto: https://images.unsplash.com/photo-[ID_UNICO]?w=800
✅ Exemplos válidos:
   - https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800 (camiseta masculina)
   - https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800 (vestido feminino)
   - https://images.unsplash.com/photo-1542272604-787c3835535d?w=800 (calça jeans)
   - https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800 (jaqueta)
✅ Tamanho: h-48 md:h-64 object-cover w-full
✅ Hover: group-hover:scale-110 transition-transform duration-300
❌ NUNCA use caminhos locais ou blob URLs

🎯 HEADER PROFISSIONAL:
✅ bg-gray-900 ou bg-gradient-to-r from-gray-900 to-gray-800
✅ Logo destacado e navegação clara
✅ py-6, sticky top-0 z-50

🔘 BOTÕES IMPACTANTES:
✅ bg-gradient-to-r from-cyan-500 to-blue-600 text-white
✅ px-6 py-3 lg:px-8 lg:py-4 rounded-lg font-semibold
✅ hover:shadow-xl hover:-translate-y-1 transform

📱 RESPONSIVIDADE TOTAL:
✅ Mobile-first com breakpoints: sm:, md:, lg:, xl:
✅ Grid adaptativo: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

✨ ANIMAÇÕES:
✅ transition-all duration-300
✅ hover:scale-105 hover:shadow-2xl
✅ hover:-translate-y-1

🦶 FOOTER PROFISSIONAL:
✅ bg-gray-900 text-white py-12
✅ Grid: grid grid-cols-1 md:grid-cols-3 gap-8

========================================
EXEMPLO REFERÊNCIA
========================================

import React from 'react';

const products = [
  {
    id: 1,
    name: 'Produto Exemplo 1',
    price: 'R$ 299,90',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'
  },
  {
    id: 2,
    name: 'Produto Exemplo 2',
    price: 'R$ 449,90',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'
  }
];

const App = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            AutoPremium
          </h1>
          <nav className="flex gap-8">
            <a href="#" className="hover:text-cyan-400 transition">Home</a>
            <a href="#" className="hover:text-cyan-400 transition">Estoque</a>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Confira Nosso <span className="text-cyan-600">Estoque</span>
          </h2>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map(product => (
            <div key={product.id} className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                />
                <div className="absolute top-4 right-4 bg-cyan-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                  {product.price}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h3>
                <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  Ver Detalhes
                </button>
              </div>
            </div>
          ))}
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2024 AutoPremium. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;

========================================
🚨 REGRAS ABSOLUTAS - NÃO QUEBRE ESTAS REGRAS 🚨
========================================

⛔ IMAGENS - REGRAS CRÍTICAS:
❌ PROIBIDO: caminhos locais (./img.png, /assets/foto.jpg, ../images/x.jpg)
❌ PROIBIDO: URLs blob (blob:https://...)
❌ PROIBIDO: placeholders genéricos sem URL real
✅ OBRIGATÓRIO: URLs HTTPS completas do Unsplash
✅ OBRIGATÓRIO: Formato https://images.unsplash.com/photo-[ID]?w=800
✅ OBRIGATÓRIO: photo-ids DIFERENTES para cada imagem
✅ OBRIGATÓRIO: Adicione ?w=800 no final para otimização

EXEMPLOS DE URLs VÁLIDAS PARA PRODUTOS:
- Roupas masculinas: https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800
- Roupas femininas: https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800
- Calçados: https://images.unsplash.com/photo-1542272604-787c3835535d?w=800
- Acessórios: https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800

Se há código anterior: EDITE mantendo todo código existente
Se é novo: Crie do zero seguindo as regras de design

CHECKLIST:
✅ JSON válido sem markdown?
✅ Design profissional, moderno e responsivo?
✅ Todas imagens são URLs HTTPS Unsplash?
✅ Componentes, cards, grid, tipografia moderna?
✅ Cores vibrantes e gradientes?
✅ Hover effects e animações?
✅ Header e footer profissionais?`;

    // Transformar mensagens para suportar imagens (formato multimodal)
    const formattedMessages = messages.map((msg: any) => {
      if (msg.images && msg.images.length > 0) {
        // Mensagem com imagens - usar formato multimodal
        const content: any[] = [
          { type: 'text', text: msg.content }
        ];
        
        // Adicionar cada imagem
        msg.images.forEach((imageData: string) => {
          content.push({
            type: 'image_url',
            image_url: {
              url: imageData // Base64 data URL
            }
          });
        });

        return {
          role: msg.role,
          content: content
        };
      } else {
        // Mensagem de texto simples
        return {
          role: msg.role,
          content: msg.content
        };
      }
    });

    console.log("📸 Mensagens formatadas com", messages.filter((m: any) => m.images?.length > 0).length, "imagens");

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
          ...formattedMessages
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro da API:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');
    
    let generatedCode = data.choices[0].message.content;

    // Limpar markdown code blocks se existirem
    generatedCode = generatedCode
      .replace(/```(?:jsx|tsx|javascript|typescript|react)?\n?/g, '')
      .replace(/```\n?/g, '');

    // Tentar extrair código de JSON se a IA retornou JSON
    try {
      const parsed = JSON.parse(generatedCode);
      if (parsed.type === 'code' && parsed.code) {
        generatedCode = parsed.code;
      } else if (parsed.code) {
        generatedCode = parsed.code;
      }
    } catch {
      // Se não for JSON, usa o conteúdo diretamente
    }

    // Limpar caracteres inválidos e erros comuns de sintaxe
    generatedCode = generatedCode
      .replace(/,\s*n\s+/g, ',\n    ')
      .replace(/,n([a-zA-Z])/g, ',\n    $1')
      .replace(/\bn\s+([a-zA-Z]+):/g, '\n    $1:')
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .trim();

    console.log('Código limpo e pronto para uso');

    return new Response(
      JSON.stringify({ code: generatedCode }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("💥 Erro no generate-code:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
  JSON.stringify({
    type: "chat",
    role: "assistant",
    message: "😔 Peço desculpas, houve um erro ao gerar o preview. Tente novamente!",
    code: null
  }),
  {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  }
);

  }
});

