import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ConversationHistoryProps {
  open: boolean;
  onClose: () => void;
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

const ConversationHistory = ({ open, onClose, currentConversationId, onSelectConversation, onNewConversation }: ConversationHistoryProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (open) loadConversations();
  }, [open]);

  const loadConversations = async () => {
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false });
    if (data) setConversations(data);
  };

  const deleteConversation = async (id: string) => {
    await supabase.from("conversations").delete().eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (currentConversationId === id) onNewConversation();
  };

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-10 bg-sidebar flex flex-col">
      <div className="p-3 border-b border-sidebar-border flex items-center justify-between">
        <h3 className="font-semibold text-sm text-sidebar-foreground">Histórico</h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { onNewConversation(); onClose(); }}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">Nenhuma conversa salva</p>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-smooth ${
                conv.id === currentConversationId
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-sidebar-accent text-sidebar-foreground"
              }`}
              onClick={() => { onSelectConversation(conv.id); onClose(); }}
            >
              <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="flex-1 truncate">{conv.title}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-smooth text-destructive"
                onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ConversationHistory;
