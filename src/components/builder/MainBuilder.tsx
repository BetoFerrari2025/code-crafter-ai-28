import { useState } from "react";
import { SendHorizonal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CodePreview from "@/components/builder/CodePreview";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const MainBuilder = () => {
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

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setIsGenerating(true);

    try {
      // Chamar o edge function com todo o histórico de mensagens
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, newMessage],
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar código');
      }

      const data = await response.json();
      
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

