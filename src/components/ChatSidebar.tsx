import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Code2, Sparkles, Loader2, Image as ImageIcon, X, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isCode?: boolean;
  images?: string[];
  isStatus?: boolean;
  isError?: boolean;
  errorDetails?: string;
}

interface ChatSidebarProps {
  onCodeGenerated?: (code: string) => void;
  currentCode?: string;
}

const ChatSidebar = ({ onCodeGenerated, currentCode }: ChatSidebarProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Olá! Estou pronto para ajudar você a criar seu aplicativo. O que você gostaria de construir hoje?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [lastErrorMessage, setLastErrorMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imagePromises = Array.from(files).map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    const base64Images = await Promise.all(imagePromises);
    setSelectedImages(prev => [...prev, ...base64Images]);
    
    toast({
      title: "Imagens carregadas",
      description: `${files.length} imagem(ns) adicionada(s)`,
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRetryWithError = useCallback((errorDetails: string) => {
    // Prepara uma mensagem de correção com o erro específico
    const fixMessage = `Por favor, corrija o seguinte erro no código:\n\n${errorDetails}`;
    setInput(fixMessage);
  }, []);

  const handleSend = async (overrideInput?: string) => {
    const messageContent = overrideInput || input;
    if ((!messageContent.trim() && selectedImages.length === 0) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent || "Gere código baseado nas imagens enviadas",
      images: selectedImages.length > 0 ? selectedImages : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    const imagesToSend = [...selectedImages];
    setSelectedImages([]);
    setIsLoading(true);

    // Mensagem de status inicial
    const statusMessageId = (Date.now() + 1).toString();
    const statusMessage: Message = {
      id: statusMessageId,
      role: "assistant",
      content: "🤔 Analisando sua solicitação...",
      isStatus: true,
    };
    setMessages((prev) => [...prev, statusMessage]);
    scrollToBottom();

    try {
      // Prepara as mensagens para enviar incluindo o código atual se existir
      const messagesToSend = messages
        .filter(m => !m.isCode && !m.isStatus && !m.isError)
        .map(m => ({
          role: m.role,
          content: m.content,
          images: m.images
        }));
      
      // Adiciona a mensagem atual do usuário
      messagesToSend.push({
        role: 'user',
        content: messageContent || "Gere código baseado nas imagens enviadas",
        images: imagesToSend.length > 0 ? imagesToSend : undefined,
      });

      // Se temos código atual e a mensagem parece ser uma correção, adiciona contexto
      const isCorrection = /(corrija|corrige|ajusta|ajuste|modifica|modifique|mude|altere|conserte|conserta|arruma|arrume|erro|bug|problema|não funciona|não está funcionando)/i.test(messageContent);
      
      if (currentCode && isCorrection) {
        // Substitui a última mensagem com o contexto do código atual
        const lastIndex = messagesToSend.length - 1;
        messagesToSend[lastIndex] = {
          ...messagesToSend[lastIndex],
          content: `${messageContent}\n\n⚠️ CÓDIGO ATUAL QUE DEVE SER CORRIGIDO (NÃO CRIE UM NOVO, APENAS MODIFIQUE):\n\n${currentCode}`,
        };
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: messagesToSend })
        }
      );

      if (!response.ok) throw new Error('Failed to generate');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let generatedCode = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) continue;
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6);
          if (data === '[DONE]') {
            // Remover mensagem de status e adicionar mensagem de sucesso
            setMessages((prev) => prev.filter(m => m.id !== statusMessageId));
            setMessages((prev) => [...prev, {
              id: (Date.now() + 2).toString(),
              role: "assistant",
              content: "✅ Código gerado com sucesso! Veja o preview ao lado.",
            }]);
            
            setLastErrorMessage("");
            
            toast({
              title: "Código gerado!",
              description: "O código foi gerado com sucesso. Confira no preview.",
            });
            scrollToBottom();
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            
            if (parsed.type === 'status') {
              // Atualizar mensagem de status
              setMessages((prev) => 
                prev.map(m => m.id === statusMessageId 
                  ? { ...m, content: parsed.status }
                  : m
                )
              );
            } else if (parsed.type === 'code') {
              generatedCode = parsed.code;
              if (onCodeGenerated) {
                onCodeGenerated(generatedCode);
              }
            }
          } catch (e) {
            console.error('Parse error:', e);
          }
        }
      }

    } catch (error) {
      console.error('Error generating code:', error);
      
      setMessages((prev) => prev.filter(m => m.id !== statusMessageId));
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "❌ Desculpe, ocorreu um erro ao gerar o código. Por favor, tente novamente.",
        isError: true,
      };
      
      setMessages((prev) => [...prev, errorMessage]);
      
      toast({
        title: "Erro",
        description: "Não foi possível gerar o código. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      scrollToBottom();
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
                    : message.isError
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-gradient-hero text-white"
                }`}
              >
                {message.role === "user" ? "U" : message.isError ? <AlertTriangle className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
              </div>
              <div
                className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : message.isError
                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                    : "bg-sidebar-accent text-sidebar-foreground"
                }`}
              >
                {message.images && message.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {message.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Uploaded ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded border border-border"
                      />
                    ))}
                  </div>
                )}
                {message.isCode ? (
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                    {message.content}
                  </pre>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
                
                {/* Botão de retry para mensagens de erro */}
                {message.isError && message.errorDetails && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 gap-1"
                    onClick={() => handleRetryWithError(message.errorDetails!)}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Tentar corrigir
                  </Button>
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
                  <p className="text-xs text-muted-foreground">Criando agora aguarde.</p>
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-sidebar-border">
        {selectedImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 p-2 bg-sidebar-accent rounded-lg">
            {selectedImages.map((img, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={img}
                  alt={`Selected ${idx + 1}`}
                  className="w-16 h-16 object-cover rounded border border-border"
                />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Descreva o que você quer fazer..."
            className="min-h-[100px] pr-24 resize-none"
          />
          <div className="absolute bottom-3 right-3 flex gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              size="icon"
              variant="ghost"
              className="rounded-full"
              disabled={isLoading}
              type="button"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleSend()}
              size="icon"
              className="rounded-full"
              disabled={(!input.trim() && selectedImages.length === 0) || isLoading}
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
    </div>
  );
};

export default ChatSidebar;
