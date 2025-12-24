import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, Home, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCodeCompiler } from "@/hooks/useCodeCompiler";

const SharedProject = () => {
  const { token } = useParams<{ token: string }>();
  const [projectName, setProjectName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [previewHtml, setPreviewHtml] = useState<string>("");
  
  const { compile } = useCodeCompiler();

  useEffect(() => {
    const loadProject = async () => {
      if (!token) {
        setError("Token de compartilhamento inválido");
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('code, name, is_published')
          .eq('share_token', token)
          .eq('is_published', true)
          .single();

        if (fetchError) {
          console.error('Error fetching project:', fetchError);
          if (fetchError.code === 'PGRST116') {
            setError("Este projeto não existe ou não está publicado");
          } else {
            setError("Erro ao carregar o projeto");
          }
          setIsLoading(false);
          return;
        }

        if (!data) {
          setError("Projeto não encontrado");
          setIsLoading(false);
          return;
        }

        if (!data.code || data.code.trim().length === 0) {
          setError("Este projeto não possui código para exibir");
          setIsLoading(false);
          return;
        }

        setProjectName(data.name || "Projeto");
        
        // Usa o hook de compilação
        const result = compile(data.code);
        
        if (result.error && !result.html.includes('id="root"')) {
          setError(`Erro ao renderizar: ${result.error}`);
        } else {
          setPreviewHtml(result.html);
        }
      } catch (err) {
        console.error('Error loading project:', err);
        setError("Erro inesperado ao carregar projeto");
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [token, compile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="text-center space-y-4 p-8">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-pulse mx-auto" />
            <Loader2 className="h-8 w-8 animate-spin text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground font-medium">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Ops! Algo deu errado</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline">
              <Link to="/" className="gap-2">
                <Home className="h-4 w-4" />
                Voltar ao início
              </Link>
            </Button>
            <Button asChild>
              <Link to="/editor" className="gap-2">
                <Code2 className="h-4 w-4" />
                Criar novo projeto
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-background">
      {/* Header minimalista */}
      <div className="h-10 bg-muted/30 border-b border-border flex items-center justify-between px-4">
        <span className="text-sm font-medium text-muted-foreground truncate max-w-[200px]">
          {projectName}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Criado com</span>
          <Link 
            to="/" 
            className="text-xs font-semibold text-primary hover:underline"
          >
            Criey
          </Link>
        </div>
      </div>
      
      {/* Preview iframe */}
      <iframe
        srcDoc={previewHtml}
        className="w-full border-0"
        style={{ height: 'calc(100vh - 40px)' }}
        title={projectName || "Shared Project Preview"}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};

export default SharedProject;
