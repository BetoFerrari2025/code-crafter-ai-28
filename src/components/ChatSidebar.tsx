import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Code2, Sparkles, Loader2, Image as ImageIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isCode?: boolean;
  images?: string[];
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
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  const handleSend = async () => {
    if ((!input.trim() && selectedImages.length === 0) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input || "Gere código baseado nas imagens enviadas",
      images: selectedImages.length > 0 ? selectedImages : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    const imagesToSend = [...selectedImages];
    setSelectedImages([]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-code', {
        body: {
          messages: [
            ...messages.filter(m => !m.isCode).map(m => ({
              role: m.role,
              content: m.content,
              images: m.images
            })),
            { role: 'user', content: input || "Gere código baseado nas imagens enviadas", images: imagesToSend }
          ]
        }
      });

      if (error) throw error;

      console.log('Resposta recebida:', data);

      // Extrair o código React puro do JSON
      let generatedCode = '';
      
      if (typeof data.code === 'string') {
        try {
          // Tenta fazer parse do JSON retornado pela IA
          const parsed = JSON.parse(data.code);
          if (parsed.type === 'code' && parsed.code) {
            generatedCode = parsed.code;
            console.log('Código extraído do JSON:', generatedCode.substring(0, 100));
          } else {
            generatedCode = data.code;
          }
        } catch (e) {
          console.log('Não é JSON, usando código diretamente');
          generatedCode = data.code;
        }
      }

      if (onCodeGenerated && generatedCode) {
        onCodeGenerated(generatedCode);
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
            placeholder="Descreva o que você quer Fazer..."
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
              onClick={handleSend}
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
