import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import ProjectsWorkspace from "@/components/ProjectsWorkspace";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Sparkles, Globe, Database, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TypeAnimation } from "react-type-animation";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import TrackingScripts from "@/components/TrackingScripts";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";

const Index = () => {
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const handleStart = () => {
    if (!prompt.trim()) {
      toast({
        title: t("hero.emptyPrompt"),
        description: t("hero.emptyPromptDesc"),
        variant: "destructive",
      });
      return;
    }
    navigate("/editor", { state: { initialPrompt: prompt } });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <TrackingScripts />
      <Header />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 opacity-50" />
      <div className="absolute inset-0 backdrop-blur-3xl" />

      <div className="relative pt-32 pb-16 px-4 md:px-6">
        <div className="container mx-auto max-w-4xl px-0 md:px-4">
          <div className="text-center mb-8 space-y-4 animate-slide-up">
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-center">
              {t("hero.title")}{" "}
              <span className="notranslate bg-gradient-hero bg-clip-text text-transparent" translate="no" style={{ fontFamily: 'inherit' }}>
                {t("hero.brand")}
              </span>
            </h1>
            <p className="text-base md:text-xl lg:text-2xl text-muted-foreground min-h-[3rem] md:min-h-[3.5rem]">
              <TypeAnimation
                key={`${t("hero.typing1")}-${t("hero.typing2")}-${t("hero.typing3")}`}
                sequence={[
                  t("hero.typing1"),
                  2500,
                  t("hero.typing2"),
                  2500,
                  t("hero.typing3"),
                  2500,
                ]}
                speed={50}
                deletionSpeed={30}
                repeat={Infinity}
              />
            </p>
          </div>

          {!isInstalled && (
            <div className="mt-8 text-center animate-fade-in md:hidden">
              <Button
                onClick={async () => {
                  if (isInstallable) {
                    const accepted = await install();
                    if (accepted) {
                      toast({ title: "App instalado!", description: "O Criey foi adicionado à sua tela inicial." });
                    }
                  } else {
                    toast({
                      title: t("hero.downloadToast"),
                      description: t("hero.downloadDesc"),
                    });
                  }
                }}
                variant="outline"
                size="lg"
                className="rounded-full"
              >
                <Download className="w-4 h-4 mr-2" />
                {t("hero.downloadApp")}
              </Button>
            </div>
          )}

          <div className="mt-8 md:mt-12 animate-slide-up mx-0" style={{ animationDelay: "0.2s" }}>
            <div className="bg-background/80 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-medium border border-border p-2 md:p-2 w-full">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t("hero.placeholder")}
                className="min-h-[100px] md:min-h-[120px] border-0 bg-transparent text-base md:text-lg resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleStart();
                  }
                }}
              />
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 px-2 pt-2">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-muted-foreground text-xs md:text-sm">
                    <Globe className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    {t("hero.public")}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground text-xs md:text-sm">
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
                  {t("hero.start")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            {[
              { icon: Sparkles, title: t("feature.ai"), description: t("feature.aiDesc") },
              { icon: Globe, title: t("feature.deploy"), description: t("feature.deployDesc") },
              { icon: Database, title: t("feature.backend"), description: t("feature.backendDesc") },
            ].map((feature, i) => (
              <div key={i} className="bg-background/50 backdrop-blur-sm rounded-xl md:rounded-2xl p-5 md:p-6 border border-border hover:shadow-soft transition-smooth w-full">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-hero flex items-center justify-center mb-3 md:mb-4">
                  <feature.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h3 className="font-semibold text-base md:text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ProjectsWorkspace />
      <WhatsAppFloatingButton />
    </div>
  );
};

export default Index;
