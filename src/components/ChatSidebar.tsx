import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Code2, Sparkles, Loader2, Image as ImageIcon, X, AlertTriangle, RefreshCw, Zap, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CreditsExhaustedAlert from "@/components/CreditsExhaustedAlert";
import ReactMarkdown from "react-markdown";
import ConversationHistory from "@/components/ConversationHistory";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isCode?: boolean;
  images?: string[];
  isStatus?: boolean;
  isError?: boolean;
  errorDetails?: string;
  timestamp?: Date;
}

interface ChatSidebarProps {
  onCodeGenerated?: (code: string) => void;
  currentCode?: string;
  fixRequest?: string;
  onFixRequestHandled?: () => void;
  initialPrompt?: string;
  onInitialPromptHandled?: () => void;
}

const ChatSidebar = ({ onCodeGenerated, currentCode, fixRequest, onFixRequestHandled, initialPrompt, onInitialPromptHandled }: ChatSidebarProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Olá! 👋 Estou pronto para criar seu app. Me diga o que você precisa!",
      timestamp: new Date(),
    },
  ]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [lastErrorMessage, setLastErrorMessage] = useState<string>("");
  const [creditsInfo, setCreditsInfo] = useState<{ used: number; max: number; remaining: number } | null>(null);
  const [showCreditsAlert, setShowCreditsAlert] = useState(false);
  const [creditsAlertMessage, setCreditsAlertMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Auto-send fix request from preview errors
  useEffect(() => {
    if (fixRequest && !isLoading) {
      const fixMsg = `Por favor, corrija o seguinte erro de compilação no código:\n\n${fixRequest}`;
      handleSend(fixMsg);
      if (onFixRequestHandled) onFixRequestHandled();
    }
  }, [fixRequest]);

  // Auto-send initial prompt from Index page
  useEffect(() => {
    if (initialPrompt && !isLoading) {
      handleSend(initialPrompt);
      if (onInitialPromptHandled) onInitialPromptHandled();
    }
  }, [initialPrompt]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  }, []);

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

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
    toast({ title: "Imagens carregadas", description: `${files.length} imagem(ns) adicionada(s)` });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRetryWithError = useCallback((errorDetails: string) => {
    const fixMessage = `Por favor, corrija o seguinte erro no código:\n\n${errorDetails}`;
    setInput(fixMessage);
  }, []);

  const promptSuggestions = [
    { icon: "🛒", label: "Loja virtual com carrinho" },
    { icon: "📋", label: "Dashboard de tarefas" },
    { icon: "🔐", label: "Login com email e senha" },
    { icon: "📊", label: "Gráficos de analytics" },
    { icon: "💬", label: "Chat em tempo real" },
    { icon: "🎨", label: "Melhore o design" },
  ];

  const handleSend = async (overrideInput?: string) => {
    const messageContent = overrideInput || input;
    if ((!messageContent.trim() && selectedImages.length === 0) || isLoading) return;
    setShowSuggestions(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent || "Gere código baseado nas imagens enviadas",
      images: selectedImages.length > 0 ? selectedImages : undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    const imagesToSend = [...selectedImages];
    setSelectedImages([]);
    setIsLoading(true);

    // Save user message to DB
    try {
      const convId = await ensureConversation(messageContent.slice(0, 60));
      await saveMessage(convId, "user", userMessage.content);
    } catch (e) {
      console.error("Error saving message:", e);
    }
    scrollToBottom();

    const statusMessageId = (Date.now() + 1).toString();
    const statusMessage: Message = {
      id: statusMessageId,
      role: "assistant",
      content: "🤔 Analisando sua solicitação...",
      isStatus: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, statusMessage]);
    scrollToBottom();

    try {
      const messagesToSend = messages
        .filter(m => !m.isCode && !m.isStatus && !m.isError)
        .map(m => ({ role: m.role, content: m.content, images: m.images }));
      
      messagesToSend.push({
        role: 'user',
        content: messageContent || "Gere código baseado nas imagens enviadas",
        images: imagesToSend.length > 0 ? imagesToSend : undefined,
      });

      const isCorrection = /(corrija|corrige|ajusta|ajuste|modifica|modifique|mude|altere|conserte|conserta|arruma|arrume|erro|bug|problema|não funciona|não está funcionando)/i.test(messageContent);
      
      if (currentCode && isCorrection) {
        const lastIndex = messagesToSend.length - 1;
        messagesToSend[lastIndex] = {
          ...messagesToSend[lastIndex],
          content: `${messageContent}\n\n⚠️ CÓDIGO ATUAL QUE DEVE SER CORRIGIDO (NÃO CRIE UM NOVO, APENAS MODIFIQUE):\n\n${currentCode}`,
        };
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ messages: messagesToSend })
        }
      );

      if (response.status === 429) {
        const errorData = await response.json();
        setMessages((prev) => prev.filter(m => m.id !== statusMessageId));
        setCreditsAlertMessage(errorData.message || 'Seus créditos diários acabaram.');
        setShowCreditsAlert(true);
        setIsLoading(false);
        return;
      }

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
            setMessages((prev) => prev.filter(m => m.id !== statusMessageId));
            const doneMsg = "✅ Código gerado com sucesso! Veja o preview ao lado.";
            setMessages((prev) => [...prev, {
              id: (Date.now() + 2).toString(),
              role: "assistant",
              content: doneMsg,
              timestamp: new Date(),
            }]);
            // Save assistant response to DB
            if (conversationId) saveMessage(conversationId, "assistant", doneMsg);
            setLastErrorMessage("");
            toast({ title: "Código gerado!", description: "O código foi gerado com sucesso." });
            scrollToBottom();
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            
            if (parsed.type === 'credits') {
              setCreditsInfo({
                used: parsed.credits_used,
                max: parsed.max_credits,
                remaining: parsed.remaining,
              });
            } else if (parsed.type === 'status') {
              setMessages((prev) => 
                prev.map(m => m.id === statusMessageId ? { ...m, content: parsed.status } : m)
              );
              scrollToBottom();
            } else if (parsed.type === 'code') {
              generatedCode = parsed.code;
              if (onCodeGenerated) onCodeGenerated(generatedCode);
            }
          } catch (e) {
            console.error('Parse error:', e);
          }
        }
      }

    } catch (error) {
      console.error('Error generating code:', error);
      setMessages((prev) => prev.filter(m => m.id !== statusMessageId));
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `${error instanceof Error ? error.message : 'Ocorreu um erro ao gerar o código.'}`,
        isError: true,
        timestamp: new Date(),
      }]);
      toast({ title: "Erro", description: "Não foi possível gerar o código.", variant: "destructive" });
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const formatTime = (date?: Date) => {
    if (!date) return "";
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Save message to DB
  const saveMessage = async (convId: string, role: string, content: string) => {
    await supabase.from("chat_messages").insert({ conversation_id: convId, role, content });
  };

  // Create or get conversation
  const ensureConversation = async (title: string): Promise<string> => {
    if (conversationId) return conversationId;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: session.user.id, title: title.slice(0, 60) })
      .select("id")
      .single();
    if (error || !data) throw error || new Error("Failed to create conversation");
    setConversationId(data.id);
    return data.id;
  };

  // Load conversation from history
  const loadConversation = async (convId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (data) {
      const loaded: Message[] = data.map((m: any) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        isCode: m.is_code,
        isError: m.is_error,
        timestamp: new Date(m.created_at),
      }));
      setMessages(loaded);
      setConversationId(convId);
      setShowSuggestions(false);
      scrollToBottom();
    }
  };

  const handleNewConversation = () => {
    setConversationId(null);
    setMessages([{
      id: "1",
      role: "assistant",
      content: "Olá! 👋 Estou pronto para criar seu app. Me diga o que você precisa!",
      timestamp: new Date(),
    }]);
    setShowSuggestions(true);
  };

  return (
    <div className="w-[400px] h-full bg-sidebar border-r border-sidebar-border flex flex-col relative">
      {/* Conversation History Overlay */}
      <ConversationHistory
        open={showHistory}
        onClose={() => setShowHistory(false)}
        currentConversationId={conversationId}
        onSelectConversation={loadConversation}
        onNewConversation={handleNewConversation}
      />

      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-hero flex items-center justify-center shadow-soft">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sidebar-foreground text-sm">Chat AI</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setShowHistory(true)}>
            <History className="h-4 w-4" />
          </Button>
          {creditsInfo && (
            <div className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
              <Zap className="h-3 w-3" />
              <span>{creditsInfo.remaining}/{creditsInfo.max}</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2.5 animate-fade-in ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium ${
                message.role === "user" ? "bg-primary text-primary-foreground"
                  : message.isError ? "bg-destructive text-destructive-foreground"
                  : message.isStatus ? "bg-muted text-muted-foreground"
                  : "bg-gradient-hero text-white"
              }`}>
                {message.role === "user" ? "U" 
                  : message.isError ? <AlertTriangle className="h-3.5 w-3.5" /> 
                  : message.isStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Code2 className="h-3.5 w-3.5" />}
              </div>
              <div className="flex flex-col gap-1 max-w-[80%]">
                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  message.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : message.isError 
                    ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-bl-md"
                    : message.isStatus
                    ? "bg-muted/50 text-muted-foreground border border-border rounded-bl-md italic"
                    : "bg-sidebar-accent text-sidebar-foreground rounded-bl-md"
                }`}>
                  {message.images && message.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {message.images.map((img, idx) => (
                        <img key={idx} src={img} alt={`Uploaded ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg border border-border/50" />
                      ))}
                    </div>
                  )}
                  {message.isCode ? (
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono">{message.content}</pre>
                  ) : message.role === "assistant" && !message.isStatus ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:m-0 [&>ol]:m-0">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}
                  {message.isError && message.errorDetails && (
                    <Button variant="outline" size="sm" className="mt-2 gap-1 h-7 text-xs" onClick={() => handleRetryWithError(message.errorDetails!)}>
                      <RefreshCw className="h-3 w-3" /> Tentar corrigir
                    </Button>
                  )}
                </div>
                <span className={`text-[10px] text-muted-foreground/60 px-1 ${message.role === "user" ? "text-right" : "text-left"}`}>
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start gap-2.5 animate-fade-in">
              <div className="w-7 h-7 rounded-full bg-gradient-hero flex items-center justify-center flex-shrink-0">
                <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
              </div>
              <div className="bg-sidebar-accent rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {showSuggestions && messages.length <= 1 && !isLoading && (
            <div className="animate-fade-in space-y-3 pt-2">
              <p className="text-xs text-muted-foreground font-medium">💡 Comece com uma sugestão:</p>
              <div className="grid grid-cols-2 gap-2">
                {promptSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(`${s.icon} ${s.label}`)}
                    className="text-xs px-3 py-2.5 rounded-xl bg-sidebar-accent hover:bg-primary/10 text-sidebar-foreground hover:text-primary transition-smooth border border-border/50 hover:border-primary/30 text-left flex items-start gap-2"
                  >
                    <span className="text-base leading-none mt-0.5">{s.icon}</span>
                    <span className="leading-tight">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="p-3 border-t border-sidebar-border bg-sidebar">
        {selectedImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 p-2 bg-sidebar-accent rounded-xl">
            {selectedImages.map((img, idx) => (
              <div key={idx} className="relative group">
                <img src={img} alt={`Selected ${idx + 1}`} className="w-14 h-14 object-cover rounded-lg border border-border/50" />
                <button onClick={() => removeImage(idx)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-smooth text-[10px]">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="relative bg-sidebar-accent rounded-xl border border-border/50 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-smooth">
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Descreva o que você quer criar..."
            rows={1}
            className="w-full bg-transparent text-sm px-4 pt-3 pb-10 resize-none outline-none placeholder:text-muted-foreground/60 text-sidebar-foreground min-h-[44px] max-h-[160px]"
            disabled={isLoading}
          />
          <div className="absolute bottom-2 right-2 flex gap-1.5">
            <Button onClick={() => fileInputRef.current?.click()} size="icon" variant="ghost" className="rounded-full h-7 w-7 text-muted-foreground hover:text-primary" disabled={isLoading} type="button">
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button onClick={() => handleSend()} size="icon" className="rounded-full h-7 w-7" disabled={(!input.trim() && selectedImages.length === 0) || isLoading}>
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/50 text-center mt-1.5">
          Shift+Enter para nova linha • Enter para enviar
        </p>
      </div>

      <CreditsExhaustedAlert
        open={showCreditsAlert}
        onOpenChange={setShowCreditsAlert}
        message={creditsAlertMessage}
      />
    </div>
  );
};

export default ChatSidebar;
