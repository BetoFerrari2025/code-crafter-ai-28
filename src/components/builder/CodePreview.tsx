import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Monitor,
  Smartphone,
  Tablet,
  Code2,
  Eye,
  Download,
  Loader2,
  Pencil,
  Save,
  X,
  ExternalLink,
  Undo2,
  Redo2,
  Copy,
  Check,
  Clock,
  Wrench,
  RefreshCw,
} from "lucide-react";
import VersionHistoryPanel from "./VersionHistoryPanel";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCodeCompiler } from "@/hooks/useCodeCompiler";
import { useCodeHistory } from "@/hooks/useCodeHistory";

type ViewMode = "desktop" | "tablet" | "mobile";
type DisplayMode = "code" | "preview";

interface CodePreviewProps {
  generatedCode?: string;
  isGenerating?: boolean;
  onCodeChange?: (code: string) => void;
  onRequestFix?: (error: string) => void;
}

const CodePreview = ({ generatedCode, isGenerating, onCodeChange, onRequestFix }: CodePreviewProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("preview");
  const [displayCode, setDisplayCode] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [compilationError, setCompilationError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { compile, cleanCode, isCompiling } = useCodeCompiler();
  const { history, currentIndex, addVersion, undo, redo, restoreVersion, canUndo, canRedo } = useCodeHistory();

  // Processa novo código gerado
  useEffect(() => {
    if (generatedCode) {
      const cleaned = cleanCode(generatedCode);
      setDisplayCode(cleaned);
      setEditedCode(cleaned);
      addVersion(cleaned, 'Código gerado pela IA');
      
      const result = compile(generatedCode);
      setPreviewHtml(result.html);
      setCompilationError(result.error);
      
      if (onCodeChange) {
        onCodeChange(cleaned);
      }
    }
  }, [generatedCode, compile, cleanCode, addVersion, onCodeChange]);

  const handleUndo = useCallback(() => {
    const version = undo();
    if (version) {
      setDisplayCode(version.code);
      setEditedCode(version.code);
      const result = compile(version.code);
      setPreviewHtml(result.html);
      setCompilationError(result.error);
      if (onCodeChange) onCodeChange(version.code);
      toast({ title: "Desfazer", description: "Versão anterior restaurada" });
    }
  }, [undo, compile, onCodeChange, toast]);

  const handleRedo = useCallback(() => {
    const version = redo();
    if (version) {
      setDisplayCode(version.code);
      setEditedCode(version.code);
      const result = compile(version.code);
      setPreviewHtml(result.html);
      setCompilationError(result.error);
      if (onCodeChange) onCodeChange(version.code);
      toast({ title: "Refazer", description: "Versão seguinte restaurada" });
    }
  }, [redo, compile, onCodeChange, toast]);

  const handleRestoreVersion = useCallback((index: number) => {
    const version = restoreVersion(index);
    if (version) {
      setDisplayCode(version.code);
      setEditedCode(version.code);
      const result = compile(version.code);
      setPreviewHtml(result.html);
      setCompilationError(result.error);
      if (onCodeChange) onCodeChange(version.code);
      toast({ title: "Restaurado", description: `Versão ${index + 1} restaurada` });
    }
  }, [restoreVersion, compile, onCodeChange, toast]);

  const handleTryFix = useCallback(() => {
    if (compilationError && onRequestFix) {
      onRequestFix(compilationError);
    }
  }, [compilationError, onRequestFix]);

  const getPreviewWidth = () => {
    switch (viewMode) {
      case "mobile":
        return "max-w-[375px]";
      case "tablet":
        return "max-w-[768px]";
      default:
        return "w-full";
    }
  };

  const handleDownloadCode = () => {
    if (!displayCode) return;
    const blob = new Blob([displayCode], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "component.tsx";
    link.click();
    toast({ title: "Download", description: "Código baixado com sucesso!" });
  };

  const handleCopyCode = async () => {
    if (!displayCode) return;
    try {
      await navigator.clipboard.writeText(displayCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast({ title: "Copiado!", description: "Código copiado para a área de transferência" });
    } catch {
      toast({ title: "Erro", description: "Não foi possível copiar", variant: "destructive" });
    }
  };

  const handleSaveEdit = () => {
    setDisplayCode(editedCode);
    setIsEditing(false);
    addVersion(editedCode, 'Editado manualmente');
    
    const result = compile(editedCode);
    setPreviewHtml(result.html);
    setCompilationError(result.error);
    
    if (onCodeChange) onCodeChange(editedCode);
    
    toast({ title: "Salvo!", description: "Alterações aplicadas ao preview" });
  };

  const handleSaveAndShare = async () => {
    if (!displayCode) return;
    
    setIsSaving(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast({
          title: "Login necessário",
          description: "Redirecionando para a página de login...",
        });
        navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      const user = session.user;

      const { data: insertData, error: insertError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: 'Projeto ' + new Date().toLocaleDateString('pt-BR'),
          code: displayCode,
          is_published: true,
        })
        .select('id, share_token')
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      if (!insertData?.share_token) {
        throw new Error('Token não gerado');
      }

      const url = `${window.location.origin}/shared/${insertData.share_token}`;
      
      await navigator.clipboard.writeText(url);
      window.open(url, '_blank');

      toast({
        title: "✅ Projeto salvo e compartilhado!",
        description: "Link copiado e aberto em nova aba.",
      });
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast({
        title: "Erro ao salvar",
        description: error?.message || "Não foi possível salvar o projeto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 h-full bg-background flex flex-row">
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <div className="h-16 border-b border-border bg-background flex items-center justify-between px-4 gap-2">
          <div className="flex items-center gap-2">
            {/* Display mode toggle */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              <Button
                variant={displayMode === "preview" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDisplayMode("preview")}
                className="h-8 px-3"
                title="Visualizar"
              >
                <Eye className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Preview</span>
              </Button>
              <Button
                variant={displayMode === "code" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDisplayMode("code")}
                className="h-8 px-3"
                title="Ver código"
              >
                <Code2 className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Código</span>
              </Button>
            </div>

            {/* Undo/Redo */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handleUndo} disabled={!canUndo} title="Desfazer" className="h-8 w-8">
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleRedo} disabled={!canRedo} title="Refazer" className="h-8 w-8">
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="ghost" size="icon" onClick={handleCopyCode} disabled={!displayCode} title="Copiar código" className="h-8 w-8">
              {isCopied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setRefreshKey(k => k + 1)} disabled={!displayCode} title="Recarregar preview" className="h-8 w-8">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDownloadCode} disabled={!displayCode} title="Baixar código" className="h-8 w-8">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="default" size="sm" onClick={handleSaveAndShare} disabled={!displayCode || isSaving} className="gap-2 h-8">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
              <span className="hidden sm:inline">Publicar</span>
            </Button>
            <Button
              variant={showHistory ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setShowHistory(!showHistory)}
              disabled={history.length === 0}
              title="Histórico de versões"
              className="h-8 w-8"
            >
              <Clock className="h-4 w-4" />
            </Button>
          </div>

          {/* Device mode */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <Button variant={viewMode === "desktop" ? "default" : "ghost"} size="icon" onClick={() => setViewMode("desktop")} className="h-8 w-8">
              <Monitor className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "tablet" ? "default" : "ghost"} size="icon" onClick={() => setViewMode("tablet")} className="h-8 w-8">
              <Tablet className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "mobile" ? "default" : "ghost"} size="icon" onClick={() => setViewMode("mobile")} className="h-8 w-8">
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-sm text-muted-foreground flex items-center gap-2">
            {(isGenerating || isCompiling) && <Loader2 className="h-4 w-4 animate-spin" />}
            {isGenerating ? "Gerando código..." : isCompiling ? "Compilando..." : "Preview ao vivo"}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto p-4 flex justify-center bg-muted/20">
          <div className={`${getPreviewWidth()} h-full transition-all duration-300 ease-in-out`}>
            <div className="w-full h-full bg-background rounded-lg shadow-lg border border-border overflow-hidden">
              {displayCode ? (
                <div className="h-full flex flex-col">
                  {/* Window controls */}
                  <div className="bg-muted/30 px-4 py-3 border-b border-border flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-destructive" />
                        <div className="w-3 h-3 rounded-full bg-accent-foreground/40" />
                        <div className="w-3 h-3 rounded-full bg-primary/60" />
                        <span className="text-xs text-muted-foreground ml-2">
                          {displayMode === "preview"
                            ? compilationError ? "Erro no preview" : "Visualização interativa"
                            : "Código gerado pela IA"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Try to fix button - appears on compilation error */}
                        {compilationError && onRequestFix && displayMode === "preview" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleTryFix}
                            className="h-7 text-xs gap-1 animate-fade-in"
                          >
                            <Wrench className="h-3 w-3" />
                            Tentar corrigir
                          </Button>
                        )}

                        {displayMode === "code" && (
                          <>
                            {!isEditing ? (
                              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="h-7 text-xs">
                                <Pencil className="h-3 w-3 mr-1" /> Editar
                              </Button>
                            ) : (
                              <>
                                <Button size="sm" variant="default" onClick={handleSaveEdit} className="h-7 text-xs">
                                  <Save className="h-3 w-3 mr-1" /> Salvar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => { setIsEditing(false); setEditedCode(displayCode || ""); }}
                                  className="h-7 w-7 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content area */}
                  <div className="flex-1 overflow-hidden">
                    {displayMode === "preview" ? (
                      <iframe
                        key={`${viewMode}-${refreshKey}-${previewHtml.slice(0, 100)}`}
                        srcDoc={previewHtml}
                        className="w-full h-full border-0"
                        title="Preview"
                        sandbox="allow-scripts allow-same-origin"
                      />
                    ) : isEditing ? (
                      <textarea
                        value={editedCode}
                        onChange={(e) => setEditedCode(e.target.value)}
                        className="w-full h-full border-0 p-4 font-mono text-sm resize-none focus:outline-none bg-background text-foreground"
                        spellCheck={false}
                      />
                    ) : (
                      <pre className="text-xs font-mono overflow-auto whitespace-pre-wrap text-foreground p-4 h-full">
                        {displayCode}
                      </pre>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-8">
                  <div className="text-center space-y-4 animate-fade-in">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                      <Monitor className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h3 className="text-2xl font-bold">Seu App Aqui</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      O código gerado pela IA aparecerá aqui em tempo real.
                      Descreva o que você quer criar no chat e veja o resultado instantaneamente.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* History panel */}
      {showHistory && (
        <VersionHistoryPanel
          history={history}
          currentIndex={currentIndex}
          onRestore={handleRestoreVersion}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
};

export default CodePreview;
