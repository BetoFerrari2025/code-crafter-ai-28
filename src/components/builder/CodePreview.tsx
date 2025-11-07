import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import * as Babel from "@babel/standalone"; // 🔥 IMPORTANTE para renderização TSX

type ViewMode = "desktop" | "tablet" | "mobile";
type DisplayMode = "code" | "preview";

interface CodePreviewProps {
  generatedCode?: string;
  isGenerating?: boolean;
}

const CodePreview = ({ generatedCode, isGenerating }: CodePreviewProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("preview");
  const [displayCode, setDisplayCode] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState<string>("");

  // 🧠 --- LIMPA e PREPARA o código do preview ---
  useEffect(() => {
    if (generatedCode) {
      let cleaned = generatedCode;

      // 👇 Novo: se o código vier em formato JSON, extrai o campo "code"
      try {
        const parsed = JSON.parse(generatedCode);
        if (parsed.code) cleaned = parsed.code;
      } catch {
        // não é JSON, segue o fluxo normal
      }

      cleaned = cleaned
        .replace(/```[a-z]*\n?/gi, "")
        .replace(/```/g, "")
        .replace(/^import\s.+from\s.+;$/gm, "")
        .trim();

      // Se tiver export default, mas não tiver const App
      if (/export\s+default\s+/.test(cleaned) && !/const\s+App\s*=/.test(cleaned)) {
        cleaned = cleaned.replace(/^export\s+default\s+/gm, "const App = ");
      } else {
        cleaned = cleaned.replace(/^export\s+default\s+/gm, "");
      }

      setDisplayCode(cleaned);
      setEditedCode(cleaned);
      compilePreview(cleaned);
    }
  }, [generatedCode]);

  // 🧩 Compila o preview React/TSX
  const compilePreview = (code: string) => {
    try {
      const transpiled = Babel.transform(code, {
        presets: ["react", "typescript", "env"],
        filename: "file.tsx",
      }).code;

      const script = `
        const exports = {};
        const { useState, useEffect, useRef, useMemo, useCallback } = React;
        const { createRoot } = ReactDOM;

        ${transpiled}

        const RenderComp = exports.default || App || Calculator || Component;
        const root = createRoot(document.getElementById("root"));
        root.render(React.createElement(RenderComp));
      `;

      const html = `
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.tailwindcss.com; style-src 'unsafe-inline' https://cdn.tailwindcss.com; img-src https: data: blob:; font-src https: data:;" />
            <title>Preview</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
            <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: system-ui, sans-serif;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
              * { box-sizing: border-box; }
            </style>
          </head>
          <body>
            <div id="root"></div>
            <script type="text/javascript">${script}</script>
          </body>
        </html>
      `;

      setPreviewHtml(html);
    } catch (err) {
      console.error("Erro ao compilar React preview:", err);
    }
  };

  // --- FUNÇÕES AUXILIARES ---
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
  };

  const handleSaveEdit = () => {
    setDisplayCode(editedCode);
    setIsEditing(false);
    compilePreview(editedCode);
  };

  // --- RENDER ---
  return (
    <div className="flex-1 h-full bg-background flex flex-col">
      {/* Topbar */}
      <div className="h-16 border-b border-border bg-background flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <Button
              variant={displayMode === "preview" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDisplayMode("preview")}
              className="h-9 px-4"
              title="Visualizar"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant={displayMode === "code" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDisplayMode("code")}
              className="h-9 px-4"
              title="Ver código"
            >
              <Code2 className="h-4 w-4" />
            </Button>
          </div>


          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadCode}
            disabled={!displayCode}
            title="Baixar código"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* Modo dispositivo */}
        <div className="flex items-center gap-2 bg-primary/10 rounded-lg p-1">
          <Button
            variant={viewMode === "desktop" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("desktop")}
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "tablet" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("tablet")}
          >
            <Tablet className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "mobile" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("mobile")}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 flex justify-end">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
            {isGenerating ? "Gerando código..." : "Preview ao vivo"}
          </div>
        </div>
      </div>

      {/* Corpo principal */}
      <div className="flex-1 overflow-auto p-6 flex justify-center bg-muted/20">
        <div className={`${getPreviewWidth()} h-full transition-all duration-300 ease-in-out`}>
          <div className="w-full h-full bg-background rounded-lg shadow-lg border border-border overflow-hidden">
            {displayCode ? (
              <div className="h-full overflow-auto">
                <div className="bg-muted/30 px-4 py-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-xs text-muted-foreground ml-2">
                        {displayMode === "preview"
                          ? "Visualização interativa"
                          : "Código gerado pela IA"}
                      </span>
                    </div>

                    {displayMode === "code" && (
                      <div className="flex items-center gap-2">
                        {!isEditing ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsEditing(true)}
                            title="Editar código"
                          >
                            <Pencil className="h-4 w-4 mr-1" /> Editar
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={handleSaveEdit}
                              title="Salvar alterações"
                            >
                              <Save className="h-4 w-4 mr-1" /> Salvar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setIsEditing(false);
                                setEditedCode(displayCode || "");
                              }}
                              title="Cancelar edição"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {displayMode === "preview" ? (
                    <iframe
                      key={viewMode + previewHtml}
                      srcDoc={previewHtml}
                      className="w-full h-[80vh] border-0 rounded-md"
                      title="Preview"
                      sandbox="allow-scripts"
                    />
                  ) : isEditing ? (
                    <textarea
                      value={editedCode}
                      onChange={(e) => setEditedCode(e.target.value)}
                      className="w-full h-[80vh] border rounded-md p-4 font-mono text-sm"
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
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-soft">
                    <Monitor className="h-8 w-8 text-white" />
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
  );
};

export default CodePreview;

