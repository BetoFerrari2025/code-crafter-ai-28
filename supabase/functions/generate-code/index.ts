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

    const systemPrompt = `Você é um assistente especializado em gerar código React com TypeScript.

Sua tarefa é gerar código completo e funcional baseado nas solicitações do usuário.

Regras importantes:
1. SEMPRE retorne apenas código, sem explicações
2. Use TypeScript e React com hooks
3. Use Tailwind CSS para estilos
4. Use componentes shadcn/ui quando apropriado
5. Importe de @/components/ui/* para componentes UI
6. Use design system tokens (hsl(var(--primary)), etc)
7. Código deve estar pronto para uso imediato
8. Não use comentários no código, apenas código puro
9. Se for uma página completa, exporte como default
10. Se for um componente, nomeie apropriadamente

Exemplo de resposta (página de vendas):
\`\`\`tsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const SalesPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold">Título da Oferta</h1>
          <p className="text-xl text-muted-foreground">Descrição atrativa</p>
        </div>
        <Card className="p-8">
          <h2 className="text-2xl font-semibold mb-4">Benefícios</h2>
          <ul className="space-y-2">
            <li>Benefício 1</li>
            <li>Benefício 2</li>
          </ul>
        </Card>
        <Button className="w-full" size="lg">Comprar Agora</Button>
      </div>
    </div>
  );
};

export default SalesPage;
\`\`\``;

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
