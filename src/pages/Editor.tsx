import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ChatSidebar from "@/components/ChatSidebar";
import CodePreview from "@/components/builder/CodePreview";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { MessageSquare, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

const Editor = () => {
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [fixRequest, setFixRequest] = useState<string>("");
  const [initialPrompt, setInitialPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [mobileView, setMobileView] = useState<"chat" | "preview">("chat");
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Auto-switch to preview when code is generated on mobile
  useEffect(() => {
    if (isMobile && generatedCode) {
      setMobileView("preview");
    }
  }, [generatedCode, isMobile]);

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
        {/* Mobile toggle bar */}
        {isMobile && (
          <div className="flex items-center border-b border-border bg-background px-2 py-1.5 gap-1">
            <Button
              variant={mobileView === "chat" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMobileView("chat")}
              className="flex-1 h-9 gap-1.5"
            >
              <MessageSquare className="h-4 w-4" />
              Chat
            </Button>
            <Button
              variant={mobileView === "preview" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMobileView("preview")}
              className="flex-1 h-9 gap-1.5"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* Chat - full width on mobile, fixed on desktop */}
          <div className={`${isMobile ? (mobileView === "chat" ? "flex w-full" : "hidden") : "flex"}`}>
            <ChatSidebar onCodeGenerated={setGeneratedCode} currentCode={generatedCode} fixRequest={fixRequest} onFixRequestHandled={() => setFixRequest("")} initialPrompt={initialPrompt} onInitialPromptHandled={() => setInitialPrompt("")} />
          </div>
          {/* Preview - full width on mobile, flex on desktop */}
          <div className={`${isMobile ? (mobileView === "preview" ? "flex-1" : "hidden") : "flex-1"}`}>
            <CodePreview generatedCode={generatedCode} onCodeChange={setGeneratedCode} onRequestFix={setFixRequest} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;

