import { useState } from "react";
import { SendHorizonal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CodePreview from "@/components/builder/CodePreview";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const MainBuilder = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "👋 Olá! Me diga o que você quer criar (ex: 'um site de venda de carros', 'um dashboard de vendas', 'um portfólio moderno').",
    },
  ]);
  const [input, setInput] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const generateCarTemplate = (prompt: string) => {
    // HTML completo, estilizado, responsivo e com cards de exemplo
    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>AutoVenda • ${escapeHtml(prompt)}</title>
<link rel="preconnect" href="https://fonts.gstatic.com">
<style>
  /* Font */
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');

  :root{
    --bg:#f6f7fb; --card:#ffffff; --muted:#6b7280; --accent:#0f62fe;
  }
  *{box-sizing:border-box}
  body{font-family:Inter,system-ui,Segoe UI,Roboto,"Helvetica Neue",Arial; margin:0;background:var(--bg); color:#0f172a;}
  .container{max-width:1100px;margin:28px auto;padding:20px;}
  header{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px}
  .brand{font-weight:800;font-size:28px;}
  nav a{margin-left:16px;color:var(--muted);text-decoration:none;font-weight:600}
  .hero{display:flex;gap:24px;align-items:center;margin-bottom:28px}
  .hero .left{flex:1}
  .hero h1{font-size:32px;margin:0 0 8px}
  .hero p{margin:0;color:var(--muted)}
  .cta{margin-top:18px}
  .btn{background:var(--accent);color:white;padding:10px 16px;border-radius:10px;border:0;cursor:pointer;font-weight:700}
  .filters{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:22px}
  .filters input,.filters select{padding:10px;border-radius:10px;border:1px solid #e6e9ef;min-width:160px}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px}
  .card{background:var(--card);border-radius:12px;box-shadow:0 6px 18px rgba(15,23,42,0.06);overflow:hidden;display:flex;flex-direction:column}
  .card img{width:100%;height:160px;object-fit:cover}
  .card-body{padding:14px;flex:1;display:flex;flex-direction:column}
  .card h3{margin:0 0 6px;font-size:16px}
  .card p{margin:0;color:var(--muted);font-size:13px}
  .meta{display:flex;justify-content:space-between;align-items:center;margin-top:12px}
  .price{font-weight:800;color:var(--accent)}
  footer{margin-top:36px;color:var(--muted);font-size:13px;text-align:center;padding:18px 0}
  @media(max-width:720px){
    .hero{flex-direction:column;align-items:flex-start}
    header{flex-direction:column;align-items:flex-start;gap:12px}
  }
</style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">AutoVenda</div>
      <nav>
        <a href="#">Início</a>
        <a href="#">Carros</a>
        <a href="#">Sobre</a>
        <a href="#">Contato</a>
      </nav>
    </header>

    <section class="hero">
      <div class="left">
        <h1>Encontre seu próximo carro</h1>
        <p>A maior seleção de veículos novos e seminovos, preços transparentes e atendimento premium.</p>
        <div class="cta"><button class="btn">Ver Ofertas</button></div>
      </div>
      <div class="right" aria-hidden="true">
        <img src="https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=8f2a50b9c6e2f0d3adf6f2f1a7b2287e" alt="car" style="width:320px;border-radius:12px;box-shadow:0 10px 30px rgba(15,23,42,0.08)">
      </div>
    </section>

    <section>
      <h2 style="margin:0 0 12px">Filtros</h2>
      <div class="filters">
        <input placeholder="Pesquisar por modelo, marca ou ano" />
        <select>
          <option>Todos</option>
          <option>Ford</option>
          <option>Tesla</option>
          <option>Porsche</option>
          <option>Honda</option>
        </select>
        <input type="number" placeholder="Preço máximo (R$)" />
        <input type="number" placeholder="Ano mínimo" />
      </div>

      <h2 style="margin:16px 0">Nossos Carros em Destaque</h2>
      <div class="grid">
        <article class="card">
          <img src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop" alt="Ford Mustang">
          <div class="card-body">
            <h3>Ford Mustang GT</h3>
            <p>Clássico americano: Motor V8, 450cv, dirigibilidade esportiva.</p>
            <div class="meta">
              <div class="price">R$ 420.000</div>
              <button class="btn" style="padding:8px 12px;font-size:13px">Ver Detalhes</button>
            </div>
          </div>
        </article>

        <article class="card">
          <img src="https://images.unsplash.com/photo-1511396277113-45b2b3ca5e47?q=80&w=1200&auto=format&fit=crop" alt="Tesla Model 3">
          <div class="card-body">
            <h3>Tesla Model 3</h3>
            <p>Tecnologia elétrica, autonomia e piloto automático.</p>
            <div class="meta">
              <div class="price">R$ 390.000</div>
              <button class="btn" style="padding:8px 12px;font-size:13px">Ver Detalhes</button>
            </div>
          </div>
        </article>

        <article class="card">
          <img src="https://images.unsplash.com/photo-1617814076518-2638e43d0a1f?q=80&w=1200&auto=format&fit=crop" alt="Porsche">
          <div class="card-body">
            <h3>Porsche 911 Carrera S</h3>
            <p>Performance e refinamento para quem busca pura emoção.</p>
            <div class="meta">
              <div class="price">R$ 780.000</div>
              <button class="btn" style="padding:8px 12px;font-size:13px">Ver Detalhes</button>
            </div>
          </div>
        </article>
      </div>
    </section>

    <footer>
      © ${new Date().getFullYear()} AutoVenda — Todos os direitos reservados
    </footer>
  </div>
</body>
</html>`;
  };

  const generateDashboardTemplate = (prompt: string) => {
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Dashboard • ${escapeHtml(
      prompt
    )}</title><style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
      body{font-family:Inter,system-ui;margin:0;background:#0f172a;color:#e6eef8;padding:28px}
      .wrap{max-width:1100px;margin:0 auto}
      h1{margin:0 0 18px}
      .cards{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:20px}
      .card{background:#0b1220;padding:16px;border-radius:12px;flex:1;min-width:180px}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
      .panel{background:#071026;padding:14px;border-radius:10px}
      @media(max-width:900px){.grid{grid-template-columns:1fr}}
    </style></head><body><div class="wrap"><h1>📊 Painel de Controle</h1><div class="cards"><div class="card"><div style="font-size:12px;color:#94a3b8">Receita (mês)</div><div style="font-weight:800;font-size:22px">R$ 124.320</div></div><div class="card"><div style="font-size:12px;color:#94a3b8">Novos clientes</div><div style="font-weight:800;font-size:22px">1.248</div></div><div class="card"><div style="font-size:12px;color:#94a3b8">Conversão</div><div style="font-weight:800;font-size:22px">6.2%</div></div></div><div class="grid"><div class="panel"><h3 style="margin:0 0 10px">Vendas por fonte</h3><p style="color:#94a3b8">Gráfico placeholder — aqui você colocaria um gráfico real (Chart.js / Recharts)</p></div><div class="panel"><h3 style="margin:0 0 10px">Últimas transações</h3><ul style="padding-left:18px;color:#94a3b8;margin:0"><li>Pedido #1234 — R$ 1.200 — Pago</li><li>Pedido #1233 — R$ 3.400 — Pendente</li></ul></div></div></div></body></html>`;
  };

  const generateDefaultTemplate = (prompt: string) => {
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Projeto • ${escapeHtml(
      prompt
    )}</title><style>body{font-family:Inter,system-ui;margin:0;padding:60px;background:#fff;color:#111}main{max-width:720px;margin:0 auto}h1{font-size:28px}pre{background:#f7f7f9;padding:16px;border-radius:8px;overflow:auto}</style></head><body><main><h1>✨ Projeto Gerado</h1><p>Prompt: <strong>${escapeHtml(
      prompt
    )}</strong></p><p>Este é um template inicial. Substitua por componentes React, estilos Tailwind, e lógica conforme necessário.</p><pre>// Aqui você pode colar o código gerado pela IA (React, HTML, CSS)</pre></main></body></html>`;
  };

  // escape simples para conteúdo do título/placeholder
  function escapeHtml(s: string) {
    return s.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m] as string));
  }

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setIsGenerating(true);

    try {
      // simula latência de geração
      await wait(800);

      const prompt = input.toLowerCase();

      let html = "";
      if (prompt.includes("carro") || prompt.includes("venda") || prompt.includes("auto")) {
        html = generateCarTemplate(input);
      } else if (prompt.includes("dashboard") || prompt.includes("painel")) {
        html = generateDashboardTemplate(input);
      } else {
        html = generateDefaultTemplate(input);
      }

      // atualiza preview
      setGeneratedCode(html);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "✅ Código gerado! Veja o preview ao lado." },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Ocorreu um erro ao gerar o código." },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Chat */}
      <div className="w-[380px] border-r border-border flex flex-col bg-background">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Sparkles className="text-primary" />
          <h2 className="font-semibold text-lg">Construtor de Apps IA</h2>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground ml-auto max-w-[85%]"
                  : "bg-muted text-foreground max-w-[90%]"
              }`}
            >
              {msg.content}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border bg-background">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Descreva o app ou site..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={isGenerating}
            />
            <Button onClick={handleSend} disabled={isGenerating}>
              {isGenerating ? (
                <Sparkles className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizonal className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1">
        <CodePreview generatedCode={generatedCode ?? ""} isGenerating={isGenerating} />
      </div>
    </div>
  );
};

export default MainBuilder;

