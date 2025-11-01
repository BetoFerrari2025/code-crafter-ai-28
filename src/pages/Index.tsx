import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import ProjectsWorkspace from "@/components/ProjectsWorkspace";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Globe, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TypeAnimation } from "react-type-animation";

const Index = () => {
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleStart = () => {
    if (!prompt.trim()) {
      toast({
        title: "Digite algo primeiro",
        description: "Descreva o que você quer criar para começar",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Iniciando projeto!",
      description: "Preparando seu ambiente de desenvolvimento...",
    });

    setTimeout(() => {
      navigate("/editor");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Header */}
      <Header />

      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 opacity-50" />
      <div className="absolute inset-0 backdrop-blur-3xl" />

      {/* Content */}
      <div className="relative pt-32 pb-16 px-4 md:px-6">
        <div className="container mx-auto max-w-4xl px-0 md:px-4">

          {/* Hero Title */}
          <div className="text-center mb-8 space-y-4 animate-slide-up">
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-center">
              Crie algo...{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent" style={{ fontFamily: 'inherit' }}>
                Criey
              </span>
            </h1>

            {/* Frase animada */}
            <p className="text-base md:text-xl lg:text-2xl text-muted-foreground min-h-[3rem] md:min-h-[3.5rem]">
              <TypeAnimation
                sequence={[
                  "Solicite à Criey a criação de um protótipo do seu projeto em poucos cliques.",
                  2500,
                  "Transforme suas ideias em interfaces completas em segundos.",
                  2500,
                  "Deixe a Criey construir o design perfeito para você.",
                  2500,
                ]}
                speed={50}
                deletionSpeed={30}
                repeat={Infinity}
              />
            </p>
          </div>

          {/* Input Box */}
          <div
            className="mt-12 animate-slide-up mx-0"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="bg-background/80 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-medium border border-border p-2 md:p-2 w-full">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Solicite a criação do seu projeto em poucos cliques..."
                className="min-h-[100px] md:min-h-[120px] border-0 bg-transparent text-base md:text-lg resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleStart();
                  }
                }}
              />

              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 px-2 pt-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground text-xs md:text-sm"
                  >
                    <Globe className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Público
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground text-xs md:text-sm"
                  >
                    <Database className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Supabase
                  </Button>
                </div>

                <Button
                  onClick={handleStart}
                  size="lg"
                  className="w-full md:w-auto rounded-full shadow-soft hover:shadow-medium transition-smooth"
                  disabled={!prompt.trim()}
                >
                  Começar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>

          {/* Features */}
          <div
            className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            {[
              {
                icon: Sparkles,
                title: "IA Generativa",
                description: "Crie interfaces completas apenas descrevendo",
              },
              {
                icon: Globe,
                title: "Deploy Instantâneo",
                description: "Publique seu app com um clique",
              },
              {
                icon: Database,
                title: "Backend Integrado",
                description: "Banco de dados e APIs prontos para usar",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-background/50 backdrop-blur-sm rounded-xl md:rounded-2xl p-5 md:p-6 border border-border hover:shadow-soft transition-smooth w-full"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-hero flex items-center justify-center mb-3 md:mb-4">
                  <feature.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h3 className="font-semibold text-base md:text-lg mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Workspace */}
      <ProjectsWorkspace />
    </div>
  );
};

export default Index;

