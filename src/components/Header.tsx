import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Gift, Bell, Settings, UserPlus, HelpCircle, Palette, LogOut, ChevronRight } from "lucide-react";
import PricingDialog from "./PricingDialog";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

const Header = () => {
  const [pricingOpen, setPricingOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchAvatar(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchAvatar(session.user.id);
      else setAvatarUrl(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAvatar = async (uid: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url, display_name")
      .eq("user_id", uid)
      .maybeSingle();
    if (data?.avatar_url) setAvatarUrl(data.avatar_url);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Logout realizado",
        description: "Você saiu da sua conta com sucesso.",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  return <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-8">
          <a href="https://criey.com.br/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-gradient-hero" />
            <span className="font-extrabold text-2xl md:text-4xl text-black drop-shadow-md" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Criey
            </span>
          </a>
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
            <button 
              onClick={() => navigate("/gallery")}
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-smooth"
            >
              Galeria
            </button>
            <a href="#" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-smooth">
              Aprender
            </a>
            <a href="#" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-smooth">
              Marketplace
            </a>
          </nav>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          {user ? (
            <>
              <Button variant="ghost" size="icon" className="rounded-full hidden md:flex">
                <Gift className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full relative hidden md:flex">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Avatar className="h-9 w-9 cursor-pointer">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-4 space-y-4">
                    {/* Profile Header */}
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-lg">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">
                          {user.email?.split('@')[0] || 'Usuário'}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* Upgrade Banner */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Torne-se um profissional</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-xs"
                        onClick={() => setPricingOpen(true)}
                      >
                        Atualizar
                      </Button>
                    </div>

                    {/* Credits Section */}
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

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="ghost" className="justify-start" size="sm" onClick={() => navigate("/profile")}>
                        <Settings className="h-4 w-4 mr-2" />
                        Configurações
                      </Button>
                      <Button variant="ghost" className="justify-start" size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Convidar
                      </Button>
                    </div>

                    <Separator />

                    {/* Footer Links */}
                    <div className="space-y-1">
                      
                      <Button variant="ghost" className="w-full justify-start" size="sm">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Centro de Ajuda
                      </Button>
                      <Button variant="ghost" className="w-full justify-between" size="sm">
                        <div className="flex items-center">
                          <Palette className="h-4 w-4 mr-2" />
                          Aparência
                        </div>
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>

                    <Separator />

                    {/* Logout */}
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" 
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
          ) : (
            <>
              <Button 
                variant="ghost" 
                onClick={() => navigate("/auth")}
                className="text-sm md:text-base px-3 md:px-4"
              >
                Login
              </Button>
              <Button 
                onClick={() => navigate("/auth")}
                className="text-sm md:text-base px-4 md:px-6"
              >
                Cadastro
              </Button>
            </>
          )}
        </div>
      </div>
      
      <PricingDialog open={pricingOpen} onOpenChange={setPricingOpen} />
    </header>;
};
export default Header;