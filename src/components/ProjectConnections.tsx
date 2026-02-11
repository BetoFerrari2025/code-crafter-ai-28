import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Database, Github, Link2, Unlink, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ConnectionState {
  connected: boolean;
  url?: string;
  token?: string;
}

const ProjectConnections = () => {
  const [supabaseConn, setSupabaseConn] = useState<ConnectionState>({ connected: false });
  const [githubConn, setGithubConn] = useState<ConnectionState>({ connected: false });
  const [showSupabaseForm, setShowSupabaseForm] = useState(false);
  const [showGithubForm, setShowGithubForm] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [githubToken, setGithubToken] = useState("");

  const connectSupabase = () => {
    if (!supabaseUrl || !supabaseKey) {
      toast({ title: "Erro", description: "Preencha a URL e a chave anon do projeto.", variant: "destructive" });
      return;
    }
    setSupabaseConn({ connected: true, url: supabaseUrl, token: supabaseKey });
    setShowSupabaseForm(false);
    toast({ title: "Conectado!", description: "Projeto Supabase conectado com sucesso." });
  };

  const connectGithub = () => {
    if (!githubRepo || !githubToken) {
      toast({ title: "Erro", description: "Preencha o repositório e o token.", variant: "destructive" });
      return;
    }
    setGithubConn({ connected: true, url: githubRepo, token: githubToken });
    setShowGithubForm(false);
    toast({ title: "Conectado!", description: "Repositório GitHub conectado com sucesso." });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Conexões do Projeto
        </CardTitle>
        <CardDescription>Conecte seu projeto a serviços externos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Supabase Connection */}
        <div className="border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Database className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <h4 className="font-semibold">Supabase</h4>
                <p className="text-xs text-muted-foreground">Banco de dados e autenticação</p>
              </div>
            </div>
            {supabaseConn.connected ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Conectado
                </Badge>
                <Button size="sm" variant="ghost" onClick={() => { setSupabaseConn({ connected: false }); toast({ title: "Desconectado" }); }}>
                  <Unlink className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => setShowSupabaseForm(!showSupabaseForm)}>
                Conectar
              </Button>
            )}
          </div>
          {showSupabaseForm && !supabaseConn.connected && (
            <div className="space-y-3 mt-3 pt-3 border-t border-border animate-fade-in">
              <div>
                <Label className="text-xs">URL do Projeto</Label>
                <Input placeholder="https://xxxxx.supabase.co" value={supabaseUrl} onChange={(e) => setSupabaseUrl(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Chave Anon (pública)</Label>
                <Input placeholder="eyJhbGciOiJIUzI1..." value={supabaseKey} onChange={(e) => setSupabaseKey(e.target.value)} className="mt-1" type="password" />
              </div>
              <Button onClick={connectSupabase} className="w-full" size="sm">Conectar Supabase</Button>
            </div>
          )}
        </div>

        {/* GitHub Connection */}
        <div className="border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-foreground/10 flex items-center justify-center">
                <Github className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold">GitHub</h4>
                <p className="text-xs text-muted-foreground">Versionamento de código</p>
              </div>
            </div>
            {githubConn.connected ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Conectado
                </Badge>
                <Button size="sm" variant="ghost" onClick={() => { setGithubConn({ connected: false }); toast({ title: "Desconectado" }); }}>
                  <Unlink className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => setShowGithubForm(!showGithubForm)}>
                Conectar
              </Button>
            )}
          </div>
          {showGithubForm && !githubConn.connected && (
            <div className="space-y-3 mt-3 pt-3 border-t border-border animate-fade-in">
              <div>
                <Label className="text-xs">Repositório (owner/repo)</Label>
                <Input placeholder="usuario/meu-projeto" value={githubRepo} onChange={(e) => setGithubRepo(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Personal Access Token</Label>
                <Input placeholder="ghp_xxxx..." value={githubToken} onChange={(e) => setGithubToken(e.target.value)} className="mt-1" type="password" />
              </div>
              <Button onClick={connectGithub} className="w-full" size="sm">Conectar GitHub</Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectConnections;
