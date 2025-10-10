import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Code2, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isCode?: boolean;
}

interface ChatSidebarProps {
  onCodeGenerated?: (code: string) => void;
}

const ChatSidebar = ({ onCodeGenerated }: ChatSidebarProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Olá! Estou pronto para ajudar você a criar seu aplicativo. O que você gostaria de construir hoje?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-code', {
        body: {
          messages: [
            ...messages.filter(m => !m.isCode).map(m => ({
              role: m.role,
              content: m.content
            })),
            { role: 'user', content: input }
          ]
        }
      });

      if (error) throw error;

      if (onCodeGenerated) {
        onCodeGenerated(data.code);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "✓ Código gerado! Veja o preview ao lado.",
      };
      
      setMessages((prev) => [...prev, aiMessage]);

      toast({
        title: "Código gerado!",
        description: "O código foi gerado com sucesso. Confira no preview.",
      });
    } catch (error) {
      console.error('Error generating code:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Desculpe, ocorreu um erro ao gerar o código. Por favor, tente novamente.",
      };
      
      setMessages((prev) => [...prev, errorMessage]);
      
      toast({
        title: "Erro",
        description: "Não foi possível gerar o código. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-[400px] h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-sidebar-foreground">Chat AI</h2>
            <p className="text-xs text-muted-foreground">Descreva o que você quer criar</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-gradient-hero text-white"
                }`}
              >
                {message.role === "user" ? "U" : <Code2 className="h-4 w-4" />}
              </div>
              <div
                className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-sidebar-accent text-sidebar-foreground"
                }`}
              >
                {message.isCode ? (
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                    {message.content}
                  </pre>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-gradient-hero flex items-center justify-center flex-shrink-0">
                <Loader2 className="h-4 w-4 text-white animate-spin" />
              </div>
              <div className="flex-1 bg-sidebar-accent rounded-2xl px-4 py-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Pensando...</p>
                  <p className="text-xs text-muted-foreground">Criando agora</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-sidebar-border">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Descreva o que você quer adicionar..."
            className="min-h-[100px] pr-12 resize-none"
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="absolute bottom-3 right-3 rounded-full"
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
