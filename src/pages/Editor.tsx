import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ChatSidebar from "@/components/ChatSidebar";
import CodePreview from "@/components/builder/CodePreview";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { ExternalLink, Loader2, MessageSquare, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const Editor = () => {
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [fixRequest, setFixRequest] = useState<string>("");
  const [initialPrompt, setInitialPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [mobileView, setMobileView] = useState<"chat" | "preview">("chat");
  const [mobileChatOpen, setMobileChatOpen] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const toggleMobileView = useCallback(() => {
    setMobileView(prev => prev === "chat" ? "preview" : "chat");
  }, []);

  const handleMobilePublish = async () => {
    if (!generatedCode) {
      toast({
        title: "Sem código para publicar",
        description: "Gere o app antes de publicar.",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        toast({
          title: t("preview.loginNeeded"),
          description: t("preview.loginRedirect"),
        });
        navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          user_id: session.user.id,
          name: "Projeto " + new Date().toLocaleDateString("pt-BR"),
          code: generatedCode,
          is_published: true,
        })
        .select("share_token")
        .single();

      if (error || !project?.share_token) {
        throw error || new Error("Falha ao publicar");
      }

      const shareUrl = `${window.location.origin}/shared/${project.share_token}`;
      await navigator.clipboard.writeText(shareUrl);
      window.open(shareUrl, "_blank");

      toast({
        title: t("preview.projectSaved"),
        description: t("preview.projectSavedDesc"),
      });
    } catch (error: any) {
      toast({
        title: t("preview.saveError"),
        description: error?.message || t("preview.saveErrorDesc"),
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: t("editor.accessDenied"),
          description: t("editor.loginRequired"),
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const projectId = (location.state as any)?.projectId;
      if (projectId) {
        try {
          const { data: project, error } = await supabase
            .from("projects")
            .select("code, name")
            .eq("id", projectId)
            .maybeSingle();

          if (!error && project?.code) {
            setGeneratedCode(project.code);
            toast({
              title: `${project.name} ${t("editor.projectLoaded")}`,
              description: t("editor.continueEditing"),
            });
          }
        } catch (e) {
          console.error("Error loading project:", e);
        }
      }

      const prompt = (location.state as any)?.initialPrompt;
      if (prompt) {
        setInitialPrompt(prompt);
      }

      setIsLoading(false);
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Auto-switch to preview on small screens when code is generated
  useEffect(() => {
    if (window.innerWidth < 768 && generatedCode) {
      setMobileView("preview");
    }
  }, [generatedCode]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("editor.checkingAuth")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <Header />

      {/* MOBILE LAYOUT (< md) */}
      <div className="flex flex-col md:hidden" style={{ height: 'calc(100dvh - 64px)', marginTop: '64px' }}>
        {/* Mobile floating buttons */}
        <div className="absolute top-[68px] left-2 z-30 flex flex-col gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileChatOpen(prev => !prev)}
            className="h-10 w-10 rounded-full shadow-lg border-border bg-background/95 backdrop-blur-sm"
          >
            <MessageSquare className="h-5 w-5 text-foreground" />
          </Button>
          <Button
            size="icon"
            onClick={handleMobilePublish}
            disabled={isPublishing || !generatedCode}
            className="h-10 w-10 rounded-full shadow-lg"
          >
            {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
          </Button>
        </div>

        {/* Chat as Sheet overlay */}
        <Sheet open={mobileChatOpen} onOpenChange={setMobileChatOpen}>
          <SheetContent side="left" className="w-[85vw] max-w-[400px] p-0">
            <SheetTitle className="sr-only">Chat</SheetTitle>
            <div className="h-full">
              <ChatSidebar
                onCodeGenerated={(code) => { setGeneratedCode(code); setMobileChatOpen(false); }}
                currentCode={generatedCode}
                fixRequest={fixRequest}
                onFixRequestHandled={() => setFixRequest("")}
                initialPrompt={initialPrompt}
                onInitialPromptHandled={() => setInitialPrompt("")}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Preview - full screen */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <CodePreview generatedCode={generatedCode} onCodeChange={setGeneratedCode} onRequestFix={setFixRequest} />
        </div>
      </div>

      {/* DESKTOP LAYOUT (>= md) */}
      <div className="hidden md:flex flex-1 overflow-hidden relative pt-16">
        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ width: chatOpen ? '380px' : '0px', minWidth: chatOpen ? '380px' : '0px' }}
        >
          <div className="w-[380px] h-full">
            <ChatSidebar
              onCodeGenerated={setGeneratedCode}
              currentCode={generatedCode}
              fixRequest={fixRequest}
              onFixRequestHandled={() => setFixRequest("")}
              initialPrompt={initialPrompt}
              onInitialPromptHandled={() => setInitialPrompt("")}
            />
          </div>
        </div>
        <div className="flex-1 relative">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setChatOpen(prev => !prev)}
            className="absolute top-3 left-3 z-10 h-9 w-9 rounded-lg shadow-md border-border bg-background/90 backdrop-blur-sm hover:bg-muted transition-all"
            title={chatOpen ? "Fechar chat" : "Abrir chat"}
          >
            {chatOpen ? <PanelLeftClose className="h-5 w-5 text-foreground" /> : <PanelLeftOpen className="h-5 w-5 text-foreground" />}
          </Button>
          <CodePreview generatedCode={generatedCode} onCodeChange={setGeneratedCode} onRequestFix={setFixRequest} />
        </div>
      </div>
    </div>
  );
};

export default Editor;


