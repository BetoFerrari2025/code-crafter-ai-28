import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ChatSidebar from "@/components/ChatSidebar";
import CodePreview from "@/components/builder/CodePreview";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";

const Editor = () => {
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [fixRequest, setFixRequest] = useState<string>("");
  const [initialPrompt, setInitialPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Acesso negado",
          description: "Você precisa fazer login para acessar o chat.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Load existing project if projectId is passed
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
              title: `Projeto "${project.name}" carregado`,
              description: "Continue editando seu projeto.",
            });
          }
        } catch (e) {
          console.error("Error loading project:", e);
        }
      }

      // Check for initial prompt from Index page
      const initialPrompt = (location.state as any)?.initialPrompt;
      if (initialPrompt) {
        setInitialPrompt(initialPrompt);
      }

      setIsLoading(false);
    };

    checkAuth();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex pt-16 overflow-hidden">
        <ChatSidebar onCodeGenerated={setGeneratedCode} currentCode={generatedCode} fixRequest={fixRequest} onFixRequestHandled={() => setFixRequest("")} initialPrompt={initialPrompt} onInitialPromptHandled={() => setInitialPrompt("")} />
        <CodePreview generatedCode={generatedCode} onCodeChange={setGeneratedCode} onRequestFix={setFixRequest} />
      </div>
    </div>
  );
};

export default Editor;

