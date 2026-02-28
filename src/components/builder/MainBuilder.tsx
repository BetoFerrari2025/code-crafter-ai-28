import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SendHorizonal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CodePreview from "@/components/builder/CodePreview";
import CreditsExhaustedAlert from "@/components/CreditsExhaustedAlert";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const MainBuilder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "👋 Olá! Me diga o que você quer criar (ex: 'um site de venda de carros', 'um dashboard de vendas', 'um portfólio moderno').",
    },
  ]);
  const [input, setInput] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [creditsExhausted, setCreditsExhausted] = useState(false);
  const [creditsMessage, setCreditsMessage] = useState("");

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Acesso negado",
          description: "Você precisa estar logado para acessar o construtor.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }
      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const callGenerateCode = useCallback(async (messagesToSend: Message[]): Promise<{ code?: string; message?: string; creditsExhausted?: boolean }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Não autenticado");

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ messages: messagesToSend }),
    });

    // Handle 429 credits exhausted (returns JSON, not SSE)
    if (response.status === 429) {
      const errorData = await response.json();
      return {
        creditsExhausted: true,
        message: errorData.message || "Créditos diários esgotados.",
      };
    }

    // Parse SSE stream
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Sem resposta do servidor");

    let code = '';
    let errorMessage = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += new TextDecoder().decode(value);
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'code' && parsed.code) {
            code = parsed.code;
          } else if (parsed.type === 'error') {
            errorMessage = parsed.message;
          } else if (parsed.type === 'credits') {
            // Dispatch event to update credit displays across the app
            window.dispatchEvent(new CustomEvent('credits-updated', {
              detail: {
                credits_used: parsed.credits_used,
                max_credits: parsed.max_credits,
                remaining: parsed.remaining,
              }
            }));
          }
        } catch {
          // ignore parse errors
        }
      }
    }

    if (errorMessage) {
      return { message: errorMessage };
    }
    if (code) {
      return { code, message: "✅ Código gerado! Veja o preview ao lado." };
    }
    return { message: "A IA não retornou código válido. Tente reformular." };
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsGenerating(true);

    try {
      const result = await callGenerateCode(updatedMessages);

      if (result.creditsExhausted) {
        setCreditsMessage(result.message || "Créditos esgotados.");
        setCreditsExhausted(true);
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: `⚠️ ${result.message}` },
        ]);
        return;
      }

      if (result.code) {
        setGeneratedCode(result.code);
      }

      setMessages(prev => [
        ...prev,
        { role: "assistant", content: result.message || "Resposta recebida." },
      ]);
    } catch (err) {
      console.error('Erro ao gerar código:', err);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "❌ Ocorreu um erro ao processar sua solicitação." },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRequestFix = useCallback(async (error: string) => {
    const fixMessage: Message = {
      role: "user",
      content: `O código anterior gerou este erro de compilação no preview. Corrija o código mantendo a mesma funcionalidade:\n\nERRO: ${error}\n\nRetorne o código completo corrigido.`,
    };

    const updatedMessages = [...messages, fixMessage];
    setMessages(updatedMessages);
    setIsGenerating(true);

    try {
      const result = await callGenerateCode(updatedMessages);

      if (result.creditsExhausted) {
        setCreditsMessage(result.message || "Créditos esgotados.");
        setCreditsExhausted(true);
        return;
      }

      if (result.code) {
        setGeneratedCode(result.code);
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: "🔧 Código corrigido automaticamente." },
        ]);
      }
    } catch (err) {
      console.error('Erro ao corrigir:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [messages, callGenerateCode]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Chat */}
      <div className="w-[380px] border-r border-border flex flex-col bg-background">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Sparkles className="text-primary" />
          <h2 className="font-semibold text-lg">Construtor de Apps IA</h2>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground ml-auto max-w-[85%]"
                  : "bg-muted text-foreground max-w-[90%]"
              }`}
            >
              {msg.content}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border bg-background">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Descreva o app ou site..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={isGenerating}
            />
            <Button onClick={handleSend} disabled={isGenerating}>
              {isGenerating ? (
                <Sparkles className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizonal className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1">
        <CodePreview
          generatedCode={generatedCode ?? ""}
          isGenerating={isGenerating}
          onRequestFix={handleRequestFix}
        />
      </div>

      <CreditsExhaustedAlert
        open={creditsExhausted}
        onOpenChange={setCreditsExhausted}
        message={creditsMessage}
      />
    </div>
  );
};

export default MainBuilder;
