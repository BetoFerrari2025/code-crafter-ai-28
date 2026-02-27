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
  Github,
  Database,
} from "lucide-react";
import VersionHistoryPanel from "./VersionHistoryPanel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCodeCompiler } from "@/hooks/useCodeCompiler";
import { useCodeHistory } from "@/hooks/useCodeHistory";
import { useLanguage } from "@/contexts/LanguageContext";

type ViewMode = "desktop" | "tablet" | "mobile";
type DisplayMode = "code" | "preview";

interface PreviewErrorTelemetry {
  error: string;
  stack?: string;
  phase: 'compilation' | 'runtime' | 'render';
  codeSnippet?: string;
  timestamp: number;
}

interface CodePreviewProps {
  generatedCode?: string;
  isGenerating?: boolean;
  onCodeChange?: (code: string) => void;
  onRequestFix?: (error: string, telemetry?: PreviewErrorTelemetry) => void;
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
  const [previewLoadError, setPreviewLoadError] = useState<string | null>(null);
  const [lastWorkingCode, setLastWorkingCode] = useState<string | null>(null);
  const [errorTelemetry, setErrorTelemetry] = useState<PreviewErrorTelemetry | null>(null);
  const [showGithubDialog, setShowGithubDialog] = useState(false);
  const [showSupabaseDialog, setShowSupabaseDialog] = useState(false);
  const [githubRepo, setGithubRepo] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [githubConnected, setGithubConnected] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const { compile, cleanCode, isCompiling } = useCodeCompiler();
  const { history, currentIndex, addVersion, undo, redo, restoreVersion, canUndo, canRedo } = useCodeHistory();

  const updatePreviewFromCode = useCallback((code: string) => {
    const result = compile(code);
    setPreviewHtml(result.html);
    setCompilationError(result.error);
    setPreviewLoadError(result.html ? null : t("preview.loadFailed"));
    
    if (result.error) {
      const telemetry: PreviewErrorTelemetry = {
        error: result.error,
        phase: 'compilation',
        codeSnippet: code.slice(0, 500),
        timestamp: Date.now(),
      };
      setErrorTelemetry(telemetry);
    } else {
      // Código compilou sem erro → salvar como última versão funcional
      setLastWorkingCode(code);
      setErrorTelemetry(null);
    }
    
    return result;
  }, [compile]);

  const handleRecompilePreview = useCallback(() => {
    if (!displayCode) return;
    updatePreviewFromCode(displayCode);
    setRefreshKey((k) => k + 1);
    toast({ title: t("preview.reload"), description: t("preview.reloadDesc") });
  }, [displayCode, updatePreviewFromCode, toast]);

  // Captura erros de runtime do iframe via postMessage
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'PREVIEW_RUNTIME_ERROR') {
        const telemetry: PreviewErrorTelemetry = {
          error: event.data.error,
          stack: event.data.stack,
          phase: 'runtime',
          codeSnippet: displayCode?.slice(0, 500),
          timestamp: event.data.timestamp || Date.now(),
        };
        setErrorTelemetry(telemetry);
        setCompilationError(event.data.error);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [displayCode]);

  // Processa novo código gerado
  useEffect(() => {
    if (generatedCode) {
      const cleaned = cleanCode(generatedCode);
      setDisplayCode(cleaned);
      setEditedCode(cleaned);
      addVersion(cleaned, t("preview.aiGenerated"));

      updatePreviewFromCode(generatedCode);

      if (onCodeChange) {
        onCodeChange(cleaned);
      }
    }
  }, [generatedCode, cleanCode, addVersion, onCodeChange, updatePreviewFromCode]);

  const handleUndo = useCallback(() => {
    const version = undo();
    if (version) {
      setDisplayCode(version.code);
      setEditedCode(version.code);
      updatePreviewFromCode(version.code);
      if (onCodeChange) onCodeChange(version.code);
      toast({ title: t("preview.undo"), description: t("preview.undoDesc") });
    }
  }, [undo, onCodeChange, toast, updatePreviewFromCode]);

  const handleRedo = useCallback(() => {
    const version = redo();
    if (version) {
      setDisplayCode(version.code);
      setEditedCode(version.code);
      updatePreviewFromCode(version.code);
      if (onCodeChange) onCodeChange(version.code);
      toast({ title: t("preview.redo"), description: t("preview.redoDesc") });
    }
  }, [redo, onCodeChange, toast, updatePreviewFromCode]);

  const handleRestoreVersion = useCallback((index: number) => {
    const version = restoreVersion(index);
    if (version) {
      setDisplayCode(version.code);
      setEditedCode(version.code);
      updatePreviewFromCode(version.code);
      if (onCodeChange) onCodeChange(version.code);
      toast({ title: t("preview.versionRestored"), description: `${t("preview.versionRestoredDesc")} ${index + 1}` });
    }
  }, [restoreVersion, onCodeChange, toast, updatePreviewFromCode]);

  const handleTryFix = useCallback(() => {
    if (compilationError && onRequestFix) {
      onRequestFix(compilationError, errorTelemetry || undefined);
    }
  }, [compilationError, onRequestFix, errorTelemetry]);

  const handleRestoreLastWorking = useCallback(() => {
    if (!lastWorkingCode) return;
    setDisplayCode(lastWorkingCode);
    setEditedCode(lastWorkingCode);
    addVersion(lastWorkingCode, t("preview.restoredWorking"));
    updatePreviewFromCode(lastWorkingCode);
    if (onCodeChange) onCodeChange(lastWorkingCode);
    toast({ title: t("preview.restore") + "!", description: t("preview.restoreDesc") });
  }, [lastWorkingCode, addVersion, updatePreviewFromCode, onCodeChange, toast]);

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
    toast({ title: "Download", description: t("preview.downloadDesc") });
  };

  const handleCopyCode = async () => {
    if (!displayCode) return;
    try {
      await navigator.clipboard.writeText(displayCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast({ title: t("preview.copied"), description: t("preview.copiedDesc") });
    } catch {
      toast({ title: t("common.error"), description: t("preview.copyError"), variant: "destructive" });
    }
  };

  const handleSaveEdit = () => {
    setDisplayCode(editedCode);
    setIsEditing(false);
    addVersion(editedCode, t("preview.manualEdit"));
    
    updatePreviewFromCode(editedCode);
    
    if (onCodeChange) onCodeChange(editedCode);
    
    toast({ title: t("preview.saved"), description: t("preview.savedDesc") });
  };

  const handleSaveAndShare = async () => {
    if (!displayCode) return;
    
    setIsSaving(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast({
          title: t("preview.loginNeeded"),
          description: t("preview.loginRedirect"),
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
        title: t("preview.projectSaved"),
        description: t("preview.projectSavedDesc"),
      });
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast({
        title: t("preview.saveError"),
        description: error?.message || t("preview.saveErrorDesc"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectGithub = () => {
    if (!githubRepo || !githubToken) {
      toast({ title: t("common.error"), description: t("connect.fillFields"), variant: "destructive" });
      return;
    }
    setGithubConnected(true);
    setShowGithubDialog(false);
    toast({ title: t("connect.githubSuccess"), description: `${t("connect.repoLinked")} ${githubRepo}` });
  };

  const handleConnectSupabase = () => {
    if (!supabaseUrl || !supabaseKey) {
      toast({ title: t("common.error"), description: t("connect.fillUrlKey"), variant: "destructive" });
      return;
    }
    setSupabaseConnected(true);
    setShowSupabaseDialog(false);
    toast({ title: t("connect.supabaseConnected"), description: t("connect.supabaseConnectedDesc") });
  };

  return (
    <div className="flex-1 h-full bg-background flex flex-row">
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <div className="h-14 md:h-16 border-b border-border bg-background flex items-center justify-between px-2 md:px-4 gap-1 md:gap-2 overflow-x-auto">
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
                <span className="hidden sm:inline">{t("preview.preview")}</span>
              </Button>
              <Button
                variant={displayMode === "code" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDisplayMode("code")}
                className="h-8 px-3"
                title={t("preview.code")}
              >
                <Code2 className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{t("preview.code")}</span>
              </Button>
            </div>

            {/* Undo/Redo */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handleUndo} disabled={!canUndo} title={t("preview.undo")} className="h-8 w-8">
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleRedo} disabled={!canRedo} title={t("preview.redo")} className="h-8 w-8">
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="ghost" size="icon" onClick={handleCopyCode} disabled={!displayCode} title={t("preview.copyCode")} className="h-8 w-8">
              {isCopied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRecompilePreview} disabled={!displayCode} title={t("preview.reload")} className="h-8 w-8">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDownloadCode} disabled={!displayCode} title={t("preview.download")} className="h-8 w-8">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="default" size="sm" onClick={handleSaveAndShare} disabled={!displayCode || isSaving} className="gap-2 h-8">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
              <span className="hidden sm:inline">{t("preview.publish")}</span>
            </Button>
            <Button
              variant={showHistory ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setShowHistory(!showHistory)}
              disabled={history.length === 0}
              title={t("preview.versionHistory")}
              className="h-8 w-8"
            >
              <Clock className="h-4 w-4" />
            </Button>

            {/* Separador */}
            <div className="w-px h-6 bg-border mx-1" />

            {/* GitHub */}
            <Button
              variant={githubConnected ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setShowGithubDialog(true)}
              title={githubConnected ? t("connect.githubConnected") : t("connect.github")}
              className="h-8 w-8 relative"
            >
              <Github className="h-4 w-4" />
              {githubConnected && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background" />
              )}
            </Button>

            {/* Supabase */}
            <Button
              variant={supabaseConnected ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setShowSupabaseDialog(true)}
              title={supabaseConnected ? t("connect.supabaseConnected") : t("connect.supabase")}
              className="h-8 w-8 relative"
            >
              <Database className="h-4 w-4" />
              {supabaseConnected && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background" />
              )}
            </Button>
          </div>

          {/* Device mode - hidden on mobile */}
          <div className="hidden md:flex items-center gap-1 bg-muted/50 rounded-lg p-1">
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
            {isGenerating ? t("preview.generating") : isCompiling ? t("preview.compiling") : t("preview.livePreview")}
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
                            ? compilationError ? t("preview.previewError") : t("preview.interactiveView")
                            : t("preview.aiCode")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Try to fix button - appears on compilation error */}
                        {compilationError && displayMode === "preview" && (
                          <div className="flex items-center gap-1">
                            {lastWorkingCode && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleRestoreLastWorking}
                                className="h-7 text-xs gap-1 animate-fade-in"
                              >
                                <Undo2 className="h-3 w-3" />
                                {t("preview.restore")}
                              </Button>
                            )}
                            {onRequestFix && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={handleTryFix}
                                className="h-7 text-xs gap-1 animate-fade-in"
                              >
                                <Wrench className="h-3 w-3" />
                                {t("preview.tryFix")}
                              </Button>
                            )}
                          </div>
                        )}

                        {displayMode === "code" && (
                          <>
                            {!isEditing ? (
                              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="h-7 text-xs">
                                <Pencil className="h-3 w-3 mr-1" /> {t("preview.edit")}
                              </Button>
                            ) : (
                              <>
                                <Button size="sm" variant="default" onClick={handleSaveEdit} className="h-7 text-xs">
                                  <Save className="h-3 w-3 mr-1" /> {t("preview.save")}
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
                      previewLoadError || !previewHtml ? (
                        <div className="h-full flex items-center justify-center p-6">
                          <div className="max-w-md text-center space-y-3 animate-fade-in">
                            <p className="text-sm text-destructive font-medium">
                              {previewLoadError || t("preview.emptyPreview")}
                            </p>
                            <Button size="sm" onClick={handleRecompilePreview} className="gap-2">
                              <RefreshCw className="h-3.5 w-3.5" />
                              {t("preview.reload")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <iframe
                          key={`${viewMode}-${refreshKey}-${previewHtml.slice(0, 100)}`}
                          srcDoc={previewHtml}
                          className="w-full h-full border-0"
                          title="Preview"
                          sandbox="allow-scripts allow-same-origin"
                          onError={() => setPreviewLoadError(t("preview.loadError"))}
                          onLoad={(event) => {
                            try {
                              const doc = event.currentTarget.contentDocument;
                              const root = doc?.getElementById("root");
                              const hasRootContent = Boolean(root && root.innerHTML.trim().length > 0);
                              const hasBodyContent = Boolean(doc?.body?.innerText?.trim().length);

                              if (!hasRootContent && !hasBodyContent) {
                                setPreviewLoadError(t("preview.loadedBlank"));
                              } else {
                                setPreviewLoadError(null);
                              }
                            } catch {
                              setPreviewLoadError(null);
                            }
                          }}
                        />
                      )
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
                    <h3 className="text-2xl font-bold">{t("preview.yourApp")}</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      {t("preview.yourAppDesc")}
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

      {/* GitHub Dialog */}
      <Dialog open={showGithubDialog} onOpenChange={setShowGithubDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" /> {t("connect.github")}
            </DialogTitle>
            <DialogDescription>{t("connect.githubDesc")}</DialogDescription>
          </DialogHeader>
          {githubConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">{t("connect.connected")}</Badge>
                <span className="text-sm text-muted-foreground">{githubRepo}</span>
              </div>
              <Button variant="destructive" size="sm" onClick={() => { setGithubConnected(false); setGithubRepo(""); setGithubToken(""); toast({ title: t("connect.githubDisconnected") }); }} className="w-full">
                {t("connect.disconnect")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-sm">{t("connect.repo")}</Label>
                <Input placeholder="user/my-project" value={githubRepo} onChange={(e) => setGithubRepo(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label className="text-sm">{t("connect.token")}</Label>
                <Input placeholder="ghp_xxxx..." value={githubToken} onChange={(e) => setGithubToken(e.target.value)} className="mt-1.5" type="password" />
              </div>
              <Button onClick={handleConnectGithub} className="w-full">{t("connect.github")}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Supabase Dialog */}
      <Dialog open={showSupabaseDialog} onOpenChange={setShowSupabaseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" /> {t("connect.supabase")}
            </DialogTitle>
            <DialogDescription>{t("connect.supabaseDesc")}</DialogDescription>
          </DialogHeader>
          {supabaseConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">{t("connect.connected")}</Badge>
                <span className="text-sm text-muted-foreground truncate">{supabaseUrl}</span>
              </div>
              <Button variant="destructive" size="sm" onClick={() => { setSupabaseConnected(false); setSupabaseUrl(""); setSupabaseKey(""); toast({ title: t("connect.supabaseDisconnected") }); }} className="w-full">
                {t("connect.disconnect")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-sm">{t("connect.projectUrl")}</Label>
                <Input placeholder="https://xxxxx.supabase.co" value={supabaseUrl} onChange={(e) => setSupabaseUrl(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label className="text-sm">{t("connect.anonKey")}</Label>
                <Input placeholder="eyJhbGciOiJIUzI1..." value={supabaseKey} onChange={(e) => setSupabaseKey(e.target.value)} className="mt-1.5" type="password" />
              </div>
              <Button onClick={handleConnectSupabase} className="w-full">{t("connect.supabase")}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CodePreview;
