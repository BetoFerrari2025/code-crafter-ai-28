import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Gift, Bell, Settings, UserPlus, Plus, HelpCircle, Palette, LogOut, ChevronRight, Check } from "lucide-react";
import PricingDialog from "./PricingDialog";

const Header = () => {
  const [pricingOpen, setPricingOpen] = useState(false);
  return <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-hero" />
            <span className="font-extrabold text-4xl text-black drop-shadow-md">
  Criey
</span>

          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-smooth">
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
              Launched
            </a>
          </nav>
        </div>
        
        <div className="flex items-center gap-3">
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
                  B
                </AvatarFallback>
              </Avatar>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 space-y-4">
                {/* Profile Header */}
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-lg">
                      B
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">Beto Ferrari</h3>
                    <p className="text-sm text-muted-foreground truncate">ferraribetoferrari@gmail.com</p>
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

                {/* Workspaces */}
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Espaços de trabalho (1)
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          B
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">Beto Ferrari</div>
                        <div className="text-xs text-muted-foreground">LIVRE</div>
                      </div>
                    </div>
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar novo espaço de trabalho
                  </Button>
                </div>

                <Separator />

                {/* Footer Links */}
                <div className="space-y-1">
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <Gift className="h-4 w-4 mr-2" />
                    Obter Créditos grátis
                  </Button>
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
                <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <PricingDialog open={pricingOpen} onOpenChange={setPricingOpen} />
    </header>;
};
export default Header;