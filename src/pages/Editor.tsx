import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ChatSidebar from "@/components/ChatSidebar";
import CodePreview from "@/components/builder/CodePreview";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { ExternalLink, Loader2, MessageSquare, Eye, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const Editor = () => {
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [fixRequest, setFixRequest] = useState<string>("");
  const [initialPrompt, setInitialPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [mobileView, setMobileView] = useState<"chat" | "preview">("chat");
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
    <div className="flex flex-col bg-background" style={{ height: '100dvh' }}>
      <Header />
      <div className="flex-1 flex flex-col pt-16 overflow-hidden min-h-0">
        {/* MOBILE LAYOUT (< md) */}
        <div className="flex flex-col flex-1 min-h-0 md:hidden">
          <div className="flex-1 overflow-hidden relative min-h-0">
            {mobileView === "chat" ? (
              <div className="h-full">
                <ChatSidebar
                  onCodeGenerated={setGeneratedCode}
                  currentCode={generatedCode}
                  fixRequest={fixRequest}
                  onFixRequestHandled={() => setFixRequest("")}
                  initialPrompt={initialPrompt}
                  onInitialPromptHandled={() => setInitialPrompt("")}
                />
              </div>
            ) : (
              <div className="h-full">
                <CodePreview generatedCode={generatedCode} onCodeChange={setGeneratedCode} onRequestFix={setFixRequest} />
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-border bg-background px-3 py-2" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={mobileView === "chat" ? "default" : "outline"}
                onClick={() => setMobileView("chat")}
                className="h-11 text-xs font-medium"
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Chat
              </Button>
              <Button
                variant={mobileView === "preview" ? "default" : "outline"}
                onClick={() => setMobileView("preview")}
                className="h-11 text-xs font-medium"
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
              <Button
                onClick={handleMobilePublish}
                disabled={isPublishing || !generatedCode}
                className="h-11 text-xs font-medium"
              >
                {isPublishing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ExternalLink className="h-4 w-4 mr-1" />}
                Publicar
              </Button>
            </div>
          </div>
        </div>

        {/* DESKTOP LAYOUT (>= md) */}
        <div className="hidden md:flex flex-1 overflow-hidden relative">
          {chatOpen && (
            <div className="flex">
              <ChatSidebar
                onCodeGenerated={setGeneratedCode}
                currentCode={generatedCode}
                fixRequest={fixRequest}
                onFixRequestHandled={() => setFixRequest("")}
                initialPrompt={initialPrompt}
                onInitialPromptHandled={() => setInitialPrompt("")}
              />
            </div>
          )}
          <div className="flex-1 relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setChatOpen(prev => !prev)}
              className="absolute top-2 left-2 z-10 h-8 w-8"
              title={chatOpen ? "Fechar chat" : "Abrir chat"}
            >
              {chatOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </Button>
            <CodePreview generatedCode={generatedCode} onCodeChange={setGeneratedCode} onRequestFix={setFixRequest} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;


