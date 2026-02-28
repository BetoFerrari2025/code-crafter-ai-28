import { useState, useCallback } from 'react';
import * as Babel from '@babel/standalone';

interface CompilationResult {
  html: string;
  error: string | null;
}

export const useCodeCompiler = () => {
  const [isCompiling, setIsCompiling] = useState(false);

  const cleanCode = useCallback((rawCode: string): string => {
    let cleaned = rawCode;

    // Se vier em formato JSON, extrai o campo "code"
    try {
      const parsed = JSON.parse(rawCode);
      if (parsed.code) cleaned = parsed.code;
    } catch {
      // não é JSON, continua
    }

    // Remove markdown code blocks
    cleaned = cleaned
      .replace(/```(?:jsx|tsx|javascript|typescript|react)?\n?/gi, '')
      .replace(/```/g, '')
      .trim();

    // Extract lucide icon names before removing imports
    const lucideImportRegex = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"];?/gm;
    const lucideIcons: string[] = [];
    let lucideMatch;
    while ((lucideMatch = lucideImportRegex.exec(cleaned)) !== null) {
      const icons = lucideMatch[1].split(',').map(s => s.trim()).filter(Boolean);
      lucideIcons.push(...icons);
    }

    // Remove imports (não suportados no browser)
    cleaned = cleaned
      .replace(/^import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm, '')
      .replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '')
      .trim();

    // Remove any existing LucideIcons destructuring lines (from previous iterations)
    cleaned = cleaned
      .replace(/^const\s*\{[^}]*\}\s*=\s*LucideIcons;\s*$/gm, '')
      .trim();

    // Add lucide icon destructuring from the proxy (single line, deduplicated)
    if (lucideIcons.length > 0) {
      const uniqueIcons = [...new Set(lucideIcons)];
      cleaned = `const { ${uniqueIcons.join(', ')} } = LucideIcons;\n${cleaned}`;
    }

    // Trata export default
    if (/export\s+default\s+function\s+(\w+)/.test(cleaned)) {
      cleaned = cleaned.replace(/export\s+default\s+function\s+(\w+)/, 'function $1');
      const match = cleaned.match(/function\s+(\w+)/);
      if (match) {
        cleaned += `\nconst App = ${match[1]};`;
      }
    } else if (/export\s+default\s+/.test(cleaned) && !/const\s+App\s*=/.test(cleaned)) {
      cleaned = cleaned.replace(/export\s+default\s+/gm, 'const App = ');
    } else {
      cleaned = cleaned.replace(/export\s+default\s+/gm, '');
    }

    // Remove outros exports
    cleaned = cleaned.replace(/^export\s+/gm, '');

    return cleaned;
  }, []);

  const compile = useCallback((rawCode: string): CompilationResult => {
    if (!rawCode || rawCode.trim().length === 0) {
      return { html: '', error: 'Nenhum código para compilar' };
    }

    setIsCompiling(true);

    try {
      const cleanedCode = cleanCode(rawCode);

      const transpiled = Babel.transform(cleanedCode, {
        presets: ['react', 'typescript', 'env'],
        filename: 'file.tsx',
      }).code;

      if (!transpiled) {
        setIsCompiling(false);
        return { html: '', error: 'Erro na transpilação do código' };
      }

      const script = `
        (function() {
          const exports = {};
          const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext, useReducer } = React;
          const { createRoot } = ReactDOM;
          const rootEl = document.getElementById("root");
          const lucide = window.lucide || {};
          let previewRendered = false;

          const escapeHtml = (value) => String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

          const renderError = (title, error) => {
            if (!rootEl) return;
            const message = escapeHtml((error && (error.message || error)) || 'Erro desconhecido');
            rootEl.innerHTML = '<div style="padding: 20px; color: #ef4444; font-family: system-ui;"><h2>' + title + '</h2><pre style="background: #fee2e2; padding: 12px; border-radius: 8px; overflow: auto; font-size: 12px;">' + message + '</pre></div>';
          };

          if (!rootEl) return;

          const handleRuntimeError = (error) => {
            console.error('Erro no preview:', error);
            renderError('Erro de Runtime', error);
            // Envia telemetria para o parent
            try {
              window.parent.postMessage({
                type: 'PREVIEW_RUNTIME_ERROR',
                error: (error && (error.message || String(error))) || 'Erro desconhecido',
                stack: error && error.stack ? error.stack : '',
                phase: 'runtime',
                timestamp: Date.now(),
              }, '*');
            } catch(e) {}
          };

          window.addEventListener('error', (event) => {
            handleRuntimeError(event.error || event.message || 'Erro desconhecido');
          });

          window.addEventListener('unhandledrejection', (event) => {
            const reason = event.reason instanceof Error ? event.reason : String(event.reason || 'Promise rejeitada');
            handleRuntimeError(reason);
          });
          
          // Create a proxy to auto-generate Lucide icon components
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
                    } catch(e) {
                      ref.current.innerHTML = '';
                    }
                  }
                }, [props]);
                const size = props.size || 24;
                return React.createElement('span', {
                  ref: ref,
                  style: { display: 'inline-flex', width: size, height: size, alignItems: 'center', justifyContent: 'center', ...(props.style || {}) },
                  className: props.className || ''
                });
              };
            }
          });

          const PreviewErrorBoundary = class extends React.Component {
            constructor(props) {
              super(props);
              this.state = { hasError: false, message: '' };
            }
            static getDerivedStateFromError(error) {
              return {
                hasError: true,
                message: (error && (error.message || String(error))) || 'Erro desconhecido',
              };
            }
            componentDidCatch(error) {
              console.error('Erro capturado pelo ErrorBoundary:', error);
            }
            render() {
              if (this.state.hasError) {
                return React.createElement('div', {
                  style: {
                    minHeight: '100vh',
                    padding: '20px',
                    color: '#ef4444',
                    fontFamily: 'system-ui',
                  }
                },
                React.createElement('h2', null, 'Erro de Renderização'),
                React.createElement('pre', {
                  style: {
                    background: '#fee2e2',
                    padding: '12px',
                    borderRadius: '8px',
                    overflow: 'auto',
                    fontSize: '12px',
                  }
                }, this.state.message));
              }
              return this.props.children;
            }
          };

          const RenderGuard = (props) => {
            React.useEffect(() => {
              previewRendered = true;
            }, []);
            return props.children;
          };

          try {
            ${transpiled}

            const RenderComp = exports.default || (typeof App !== 'undefined' ? App : null) || 
                               (typeof Calculator !== 'undefined' ? Calculator : null) || 
                               (typeof Component !== 'undefined' ? Component : null) ||
                               (typeof Main !== 'undefined' ? Main : null) ||
                               (typeof Page !== 'undefined' ? Page : null);
            
            if (!RenderComp) {
              renderError('Erro', 'Nenhum componente encontrado para renderizar. Certifique-se de exportar um componente válido.');
              return;
            }

            const root = createRoot(rootEl);
            root.render(
              React.createElement(
                PreviewErrorBoundary,
                null,
                React.createElement(RenderGuard, null, React.createElement(RenderComp))
              )
            );

            setTimeout(() => {
              if (!previewRendered && rootEl.innerHTML.trim().length === 0) {
                renderError('Erro de Renderização', 'O componente não gerou saída visível.');
              }
            }, 1200);
          } catch (err) {
            handleRuntimeError(err);
          }
        })();
      `;

      const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com; img-src https: data: blob:; font-src https: data: https://fonts.gstatic.com; connect-src https:; worker-src blob:;" />
    <title>Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 0;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      #root { min-height: 100vh; }
      
      /* Advanced CSS Animations */
      @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
      @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      @keyframes slideDown { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
      @keyframes slideLeft { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
      @keyframes slideRight { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
      @keyframes scaleIn { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
      @keyframes rotateIn { from{opacity:0;transform:rotate(-10deg)} to{opacity:1;transform:rotate(0)} }
      @keyframes bounceIn { 0%{opacity:0;transform:scale(0.3)} 50%{transform:scale(1.05)} 70%{transform:scale(0.9)} 100%{opacity:1;transform:scale(1)} }
      @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      @keyframes gradient { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
      @keyframes typewriter { from{width:0} to{width:100%} }
      @keyframes blink { 0%,100%{border-color:transparent} 50%{border-color:currentColor} }
      @keyframes shake { 0%,100%{transform:translateX(0)} 10%,30%,50%,70%,90%{transform:translateX(-5px)} 20%,40%,60%,80%{transform:translateX(5px)} }
      @keyframes ripple { to{transform:scale(4);opacity:0} }
      @keyframes fadeInUp { from{opacity:0;transform:translate3d(0,30px,0)} to{opacity:1;transform:translate3d(0,0,0)} }
      @keyframes swing { 20%{transform:rotate3d(0,0,1,15deg)} 40%{transform:rotate3d(0,0,1,-10deg)} 60%{transform:rotate3d(0,0,1,5deg)} 80%{transform:rotate3d(0,0,1,-5deg)} 100%{transform:rotate3d(0,0,1,0deg)} }
      
      .animate-float { animation: float 3s ease-in-out infinite; }
      .animate-shimmer { animation: shimmer 2s linear infinite; background-size: 200% 100%; }
      .animate-slide-up { animation: slideUp 0.5s ease-out forwards; }
      .animate-slide-down { animation: slideDown 0.5s ease-out forwards; }
      .animate-slide-left { animation: slideLeft 0.5s ease-out forwards; }
      .animate-slide-right { animation: slideRight 0.5s ease-out forwards; }
      .animate-scale-in { animation: scaleIn 0.4s ease-out forwards; }
      .animate-rotate-in { animation: rotateIn 0.5s ease-out forwards; }
      .animate-bounce-in { animation: bounceIn 0.6s ease-out forwards; }
      .animate-pulse-custom { animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite; }
      .animate-gradient { animation: gradient 3s ease infinite; background-size: 200% 200%; }
      .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
      .animate-shake { animation: shake 0.5s ease-in-out; }
      .animate-swing { animation: swing 1s ease-in-out; }
      .stagger-1 { animation-delay: 0.1s; opacity: 0; }
      .stagger-2 { animation-delay: 0.2s; opacity: 0; }
      .stagger-3 { animation-delay: 0.3s; opacity: 0; }
      .stagger-4 { animation-delay: 0.4s; opacity: 0; }
      .stagger-5 { animation-delay: 0.5s; opacity: 0; }
      .glass { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); }
      .glass-dark { background: rgba(0,0,0,0.2); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
      .text-gradient { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="text/javascript">${script}</script>
  </body>
</html>`;

      setIsCompiling(false);
      return { html, error: null };
    } catch (err: any) {
      setIsCompiling(false);
      console.error('Erro ao compilar código:', err);
      
      const errorMessage = err.message || 'Erro desconhecido na compilação';
      const errorHtml = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Erro de Compilação</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body class="bg-gray-50 min-h-screen flex items-center justify-center p-4 font-sans">
    <div class="max-w-lg w-full bg-white rounded-xl shadow-lg p-6 border border-red-100">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
          <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>
        <h2 class="text-xl font-bold text-gray-900">Erro de Compilação</h2>
      </div>
      <div class="bg-red-50 rounded-lg p-4 border border-red-200">
        <pre class="text-sm text-red-700 whitespace-pre-wrap overflow-auto">${errorMessage}</pre>
      </div>
      <p class="mt-4 text-sm text-gray-500">
        Verifique o código e tente novamente. Peça para a IA corrigir o erro específico.
      </p>
    </div>
  </body>
</html>`;

      return { html: errorHtml, error: errorMessage };
    }
  }, [cleanCode]);

  return {
    compile,
    cleanCode,
    isCompiling,
  };
};
