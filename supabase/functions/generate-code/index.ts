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
REGRAS CRÍTICAS DE RESPOSTA
========================================

⚠️ SINTAXE PERFEITA OBRIGATÓRIA:
✅ Código JavaScript/React VÁLIDO sem erros de sintaxe
✅ Vírgulas, pontos e vírgulas corretos
✅ Propriedades de objetos separadas por vírgula OU quebra de linha
✅ Indentação consistente (2 ou 4 espaços)
✅ NUNCA misture caracteres aleatórios entre propriedades

SEMPRE retorne JSON PURO sem markdown ou code blocks:

Para COMANDOS (criar, gerar, fazer, construir, adicionar, modificar):
{
  "type": "code",
  "message": "Aplicação criada com sucesso! Confira o preview.",
  "code": "import React from 'react';\\n\\nconst App = () => {\\n  return <div>...</div>;\\n};\\n\\nexport default App;"
}

Para CONVERSAS (perguntas, cumprimentos, mensagens curtas):
{
  "type": "message",
  "message": "Olá! Como posso ajudar você a criar sua aplicação?",
  "code": null
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

🖼️ IMAGENS ALTA QUALIDADE:
✅ SEMPRE use Unsplash: https://images.unsplash.com/photo-XXX?w=800
✅ Tamanho: h-48 md:h-64 object-cover w-full
✅ Hover: group-hover:scale-110 transition-transform duration-300

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

const cars = [
  {
    id: 1,
    name: 'BMW X5 M Sport',
    year: 2023,
    price: 'R$ 546.000',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800'
  },
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
          {cars.map(car => (
            <div key={car.id} className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={car.image} 
                  alt={car.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                />
                <div className="absolute top-4 right-4 bg-cyan-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                  {car.price}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{car.name}</h3>
                <p className="text-gray-600 mb-4">{car.year}</p>
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
REGRAS ABSOLUTAS
========================================

❌ NUNCA use imagens locais (./img.png, /assets/foto.jpg)
✅ SEMPRE use URLs Unsplash HTTPS
✅ Use diferentes photo-ids para cada imagem
✅ Adicione ?w=800 para otimização

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

    // Parse o JSON retornado pela IA para extrair o código
    try {
      const parsed = JSON.parse(generatedCode);
      if (parsed.type === 'code' && parsed.code) {
        generatedCode = parsed.code;
      }
    } catch {
      // Se não for JSON, usa o conteúdo diretamente
    }

    // Limpar caracteres inválidos e erros comuns de sintaxe
    generatedCode = generatedCode
      .replace(/,\s*n\s+/g, ',\n    ') // Corrige ",n    " para ",\n    "
      .replace(/,n([a-zA-Z])/g, ',\n    $1') // Corrige ",n" seguido de letra
      .replace(/\bn\s+([a-zA-Z]+):/g, '\n    $1:'); // Corrige "n prop:" para "\n    prop:"

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

