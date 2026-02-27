import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ChatSidebar from "@/components/ChatSidebar";
import CodePreview from "@/components/builder/CodePreview";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowLeftRight, ExternalLink, Loader2, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";

const Editor = () => {
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [fixRequest, setFixRequest] = useState<string>("");
  const [initialPrompt, setInitialPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [mobileView, setMobileView] = useState<"chat" | "preview">("chat");
  const [isPublishing, setIsPublishing] = useState(false);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();

  const scrollToMobileView = useCallback((view: "chat" | "preview") => {
    const container = mobileScrollRef.current;
    if (!container) return;

    const targetLeft = view === "preview" ? container.clientWidth : 0;
    container.scrollTo({ left: targetLeft, behavior: "smooth" });
    setMobileView(view);
  }, []);

  const handleMobilePanelScroll = useCallback(() => {
    const container = mobileScrollRef.current;
    if (!container) return;

    const nextView = container.scrollLeft > container.clientWidth / 2 ? "preview" : "chat";
    if (nextView !== mobileView) {
      setMobileView(nextView);
    }
  }, [mobileView]);

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

  useEffect(() => {
    if (isMobile && generatedCode) {
      scrollToMobileView("preview");
    }
  }, [generatedCode, isMobile, scrollToMobileView]);

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
    <div className="h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex flex-col pt-16 overflow-hidden">
        {isMobile ? (
          <>
            <div className="border-b border-border bg-background px-3 py-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <div className="flex items-center gap-1.5">
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  <span>Arraste para o lado</span>
                </div>
                <span className="font-medium text-foreground">{mobileView === "chat" ? "Chat" : "Preview"}</span>
              </div>

              <input
                type="range"
                min={0}
                max={1}
                step={1}
                value={mobileView === "chat" ? 0 : 1}
                onChange={(e) => scrollToMobileView(e.target.value === "0" ? "chat" : "preview")}
                className="w-full accent-primary"
                aria-label="Alternar entre chat e preview"
              />
            </div>

            <div
              ref={mobileScrollRef}
              onScroll={handleMobilePanelScroll}
              className="flex-1 overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth"
            >
              <div className="flex h-full w-[200%] min-w-[200%]">
                <div className="w-full min-w-full h-full snap-start border-r border-border overflow-hidden">
                  <ChatSidebar
                    onCodeGenerated={setGeneratedCode}
                    currentCode={generatedCode}
                    fixRequest={fixRequest}
                    onFixRequestHandled={() => setFixRequest("")}
                    initialPrompt={initialPrompt}
                    onInitialPromptHandled={() => setInitialPrompt("")}
                  />
                </div>

                <div className="w-full min-w-full h-full snap-start overflow-hidden">
                  <CodePreview generatedCode={generatedCode} onCodeChange={setGeneratedCode} onRequestFix={setFixRequest} />
                </div>
              </div>
            </div>

            <div className="border-t border-border bg-background/95 backdrop-blur px-2 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleMobilePublish} disabled={isPublishing || !generatedCode} className="h-10">
                  {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                  <span>{isPublishing ? "Publicando..." : "Publicar"}</span>
                </Button>

                <Button variant="outline" onClick={toggleTheme} className="h-10">
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  <span>{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex overflow-hidden">
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
            <div className="flex-1">
              <CodePreview generatedCode={generatedCode} onCodeChange={setGeneratedCode} onRequestFix={setFixRequest} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Editor;


