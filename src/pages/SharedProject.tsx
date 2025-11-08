import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import * as Babel from "@babel/standalone";

const SharedProject = () => {
  const { token } = useParams<{ token: string }>();
  const [code, setCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [previewHtml, setPreviewHtml] = useState<string>("");

  useEffect(() => {
    const loadProject = async () => {
      if (!token) {
        setError("Token inválido");
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('projects')
          .select('code, name, is_published')
          .eq('share_token', token)
          .eq('is_published', true)
          .single();

        if (error || !data) {
          setError("Projeto não encontrado ou não está publicado");
          setIsLoading(false);
          return;
        }

        setCode(data.code || "");
        compilePreview(data.code || "");
      } catch (err) {
        console.error('Error loading project:', err);
        setError("Erro ao carregar projeto");
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [token]);

  const compilePreview = (code: string) => {
    try {
      let cleaned = code
        .replace(/```[a-z]*\n?/gi, "")
        .replace(/```/g, "")
        .replace(/^import\s.+from\s.+;$/gm, "")
        .trim();

      if (/export\s+default\s+/.test(cleaned) && !/const\s+App\s*=/.test(cleaned)) {
        cleaned = cleaned.replace(/^export\s+default\s+/gm, "const App = ");
      } else {
        cleaned = cleaned.replace(/^export\s+default\s+/gm, "");
      }

      const transpiled = Babel.transform(cleaned, {
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
            <title>Shared Project</title>
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
      console.error("Erro ao compilar preview:", err);
      setError("Erro ao renderizar projeto");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-destructive">Erro</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <iframe
        srcDoc={previewHtml}
        className="w-full h-full border-0"
        title="Shared Project Preview"
        sandbox="allow-scripts"
      />
    </div>
  );
};

export default SharedProject;
