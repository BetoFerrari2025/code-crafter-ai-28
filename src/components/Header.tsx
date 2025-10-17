import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Gift,
  Bell,
  Settings,
  UserPlus,
  HelpCircle,
  Palette,
  LogOut,
  ChevronRight,
  Check,
} from "lucide-react";
import PricingDialog from "./PricingDialog";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const [pricingOpen, setPricingOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  // Verifica se o usuário está logado ao carregar o header
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    checkUser();

    // Escuta mudanças no estado de autenticação
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Função de logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/"); // Redireciona para home
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* LOGO + NAV */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-hero" />
            <span className="font-extrabold text-4xl text-black drop-shadow-md">Criey</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a
              href="https://chat.whatsapp.com/Jtwl0qmsPT44ezle5xDjbB?mode=ems_copy_t"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-smooth"
            >
              Comunidade
            </a>
            <button
              onClick={() => setPricingOpen(true)}
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-smooth"
            >
              Preços
            </button>
            <a href="#" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-smooth">
              Empresarial
            </a>
            <a href="#" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-smooth">
              Aprender
            </a>
            <a href="#" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-smooth">
              Marketplace
            </a>
          </nav>
        </div>

        {/* SEÇÃO DIREITA */}
        <div className="flex items-center gap-3">
          {!user ? (
            // 🔹 Se o usuário NÃO estiver logado
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/login")}
                className="font-medium"
              >
                Login
              </Button>
              <Button
                onClick={() => navigate("/login")}
                className="bg-black text-white font-medium hover:bg-gray-800"
              >
                Começar
              </Button>
            </div>
          ) : (
            // 🔹 Se o usuário ESTIVER logado
            <>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Gift className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Avatar className="h-9 w-9 cursor-pointer">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {user.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </PopoverTrigger>

                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-4 space-y-4">
                    {/* Perfil */}
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-lg">
                          {user.email?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">
                          {user.user_metadata?.name || "Usuário"}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* Créditos */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Créditos</span>
                        <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                          5 restantes
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                      <Progress value={100} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        Os créditos diários são reiniciados à meia-noite UTC
                      </p>
                    </div>

                    <Separator />

                    {/* Botões */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="ghost" className="justify-start" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurações
                      </Button>
                      <Button variant="ghost" className="justify-start" size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Convidar
                      </Button>
                    </div>

                    <Separator />

                    {/* Logout */}
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-destructive hover:text-destructive"
                      size="sm"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
      </div>

      <PricingDialog open={pricingOpen} onOpenChange={setPricingOpen} />
    </header>
  );
};

export default Header;

