import { useState, useEffect } from 'react';
import * as Babel from '@babel/standalone';

interface ProjectThumbnailPreviewProps {
  code: string | null;
  projectName: string;
}

const ProjectThumbnailPreview = ({ code, projectName }: ProjectThumbnailPreviewProps) => {
  const [previewHtml, setPreviewHtml] = useState<string>('');

  useEffect(() => {
    if (code) {
      compilePreview(code);
    }
  }, [code]);

  const compilePreview = (rawCode: string) => {
    try {
      let cleaned = rawCode;

      // Se o código vier em formato JSON, extrai o campo "code"
      try {
        const parsed = JSON.parse(rawCode);
        if (parsed.code) cleaned = parsed.code;
      } catch {
        // não é JSON, segue o fluxo normal
      }

      // Extract lucide icons before removing imports
      const lucideImportRegex = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"];?/gm;
      const lucideIcons: string[] = [];
      let lucideMatch;
      while ((lucideMatch = lucideImportRegex.exec(cleaned)) !== null) {
        const icons = lucideMatch[1].split(',').map((s: string) => s.trim()).filter(Boolean);
        lucideIcons.push(...icons);
      }

      cleaned = cleaned
        .replace(/```[a-z]*\n?/gi, '')
        .replace(/```/g, '')
        .replace(/^import\s.+from\s.+;$/gm, '')
        .trim();

      // Add lucide icon destructuring
      if (lucideIcons.length > 0) {
        const uniqueIcons = [...new Set(lucideIcons)];
        cleaned = `const { ${uniqueIcons.join(', ')} } = LucideIcons;\n${cleaned}`;
      }

      // Se tiver export default, mas não tiver const App
      if (/export\s+default\s+/.test(cleaned) && !/const\s+App\s*=/.test(cleaned)) {
        cleaned = cleaned.replace(/^export\s+default\s+/gm, 'const App = ');
      } else {
        cleaned = cleaned.replace(/^export\s+default\s+/gm, '');
      }

      const transpiled = Babel.transform(cleaned, {
        presets: ['react', 'typescript', 'env'],
        filename: 'file.tsx',
      }).code;

      const script = `
        const exports = {};
        const { useState, useEffect, useRef, useMemo, useCallback } = React;
        const { createRoot } = ReactDOM;
        const lucide = window.lucide || {};
        const LucideIcons = new Proxy({}, {
          get: function(target, prop) {
            if (typeof prop !== 'string') return undefined;
            return function LucideIcon(props) {
              const ref = React.useRef(null);
              React.useEffect(() => {
                if (ref.current && lucide[prop]) {
                  try {
                    const result = lucide.createElement(lucide[prop]);
                    ref.current.innerHTML = '';
                    ref.current.appendChild(result);
                  } catch(e) {}
                }
              }, []);
              const size = (props && props.size) || 24;
              return React.createElement('span', {
                ref: ref,
                style: { display: 'inline-flex', width: size, height: size, alignItems: 'center', justifyContent: 'center' },
                className: (props && props.className) || ''
              });
            };
          }
        });

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
            <script src="https://cdn.tailwindcss.com"></script>
            <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
            <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
            <script src="https://unpkg.com/lucide@latest"></script>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: system-ui, sans-serif;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                overflow: hidden;
              }
              * { box-sizing: border-box; }
              /* Disable all interactions */
              * { pointer-events: none !important; }
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
      console.error('Erro ao compilar preview em miniatura:', err);
      setPreviewHtml('');
    }
  };

  if (!code || !previewHtml) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
        <div className="text-6xl font-bold text-muted-foreground/20">
          {projectName.charAt(0).toUpperCase()}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden bg-background">
      <iframe
        srcDoc={previewHtml}
        className="w-[400%] h-[400%] border-0 origin-top-left"
        style={{ transform: 'scale(0.25)' }}
        title="Preview em miniatura"
        sandbox="allow-scripts"
      />
    </div>
  );
};

export default ProjectThumbnailPreview;
