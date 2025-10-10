import { Monitor, Smartphone, Tablet, Code2, Eye, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

type ViewMode = "desktop" | "tablet" | "mobile";
type DisplayMode = "code" | "preview";

interface CodePreviewProps {
  generatedCode?: string;
}

const CodePreview = ({ generatedCode }: CodePreviewProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("code");
  const [displayCode, setDisplayCode] = useState<string | null>(null);

  useEffect(() => {
    if (generatedCode) {
      setDisplayCode(generatedCode);
      setDisplayMode("preview");
    }
  }, [generatedCode]);

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

  const handleOpenInBrowser = () => {
    if (displayCode) {
      const blob = new Blob([displayCode], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  };

  return (
    <div className="flex-1 h-full bg-background flex flex-col">
      <div className="h-16 border-b border-border bg-background flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <Button
              variant={displayMode === "preview" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDisplayMode("preview")}
              className="h-9 px-4"
              title="Preview"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant={displayMode === "code" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDisplayMode("code")}
              className="h-9 px-4"
              title="Código"
            >
              <Code2 className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenInBrowser}
            className="h-9 px-4"
            disabled={!displayCode}
            title="Abrir no navegador"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 bg-primary/10 rounded-lg p-1">
          <Button
            variant={viewMode === "desktop" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("desktop")}
            className="h-9 px-4"
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "tablet" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("tablet")}
            className="h-9 px-4"
          >
            <Tablet className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "mobile" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("mobile")}
            className="h-9 px-4"
          >
            <Smartphone className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 flex justify-end">
          <div className="text-sm text-muted-foreground">Preview ao vivo</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 flex justify-center bg-muted/20">
        <div className={`${getPreviewWidth()} h-full transition-all duration-300`}>
          <div className="w-full h-full bg-background rounded-lg shadow-lg border border-border overflow-hidden">
            {displayCode ? (
              <div className="h-full overflow-auto">
                <div className="bg-muted/30 px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs text-muted-foreground ml-2">
                      {displayMode === "preview" ? "Preview do Código" : "Código Gerado"}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  {displayMode === "preview" ? (
                    <iframe
                      srcDoc={displayCode}
                      className="w-full h-full border-0"
                      title="Preview"
                      sandbox="allow-scripts"
                    />
                  ) : (
                    <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap text-foreground">
                      {displayCode}
                    </pre>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-8">
                <div className="text-center space-y-4 animate-fade-in">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-hero flex items-center justify-center shadow-soft">
                    <Monitor className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">Seu App Aqui</h3>
                  <p className="text-muted-foreground max-w-md">
                    O código gerado pela IA aparecerá aqui em tempo real. Comece descrevendo o que você quer criar no chat.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodePreview;
