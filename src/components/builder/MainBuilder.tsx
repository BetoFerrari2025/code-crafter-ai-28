import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SendHorizonal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CodePreview from "@/components/builder/CodePreview";

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

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setIsGenerating(true);

    try {
      // Use supabase.functions.invoke for authenticated calls
      const { data, error } = await supabase.functions.invoke('generate-code', {
        body: { messages: [...messages, newMessage] }
      });

      if (error) {
        throw error;
      }
      
      // Verificar o tipo de resposta da IA
      if (data.type === 'code' && data.code) {
        // É um comando de geração - atualizar preview
        setGeneratedCode(data.code);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message || "✅ Código gerado! Veja o preview ao lado." },
        ]);
      } else if (data.type === 'message') {
        // É apenas uma conversa - não atualizar preview
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message },
        ]);
      } else {
        // Fallback para compatibilidade
        if (data.code) {
          setGeneratedCode(data.code);
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "✅ Código gerado! Veja o preview ao lado." },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.message || "Resposta recebida." },
          ]);
        }
      }
    } catch (err) {
      console.error('Erro ao gerar código:', err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Ocorreu um erro ao processar sua solicitação." },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

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
        <CodePreview generatedCode={generatedCode ?? ""} isGenerating={isGenerating} />
      </div>
    </div>
  );
};

export default MainBuilder;

