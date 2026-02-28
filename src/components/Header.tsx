import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Gift, Bell, Settings, UserPlus, HelpCircle, LogOut, ChevronRight, Moon, Sun, Globe, Shield } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useLanguage } from "@/contexts/LanguageContext";
import PricingDialog from "./PricingDialog";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

const Header = () => {
  const [pricingOpen, setPricingOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState<number>(5);
  const [maxCredits, setMaxCredits] = useState<number>(5);
  const [monthlyUsed, setMonthlyUsed] = useState<number>(0);
  const [monthlyMax, setMonthlyMax] = useState<number>(30);
  const [monthlyRemaining, setMonthlyRemaining] = useState<number>(30);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const fetchCredits = async (uid: string) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("user_daily_credits")
        .select("credits_used, max_credits")
        .eq("user_id", uid)
        .eq("usage_date", today)
        .maybeSingle();
      if (data) {
        setCreditsRemaining(data.max_credits - data.credits_used);
        setMaxCredits(data.max_credits);
      } else {
        setCreditsRemaining(5);
        setMaxCredits(5);
      }

      // Fetch monthly credits
      const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
      const { data: monthlyData } = await supabase
        .from("user_monthly_credits")
        .select("credits_used, max_credits")
        .eq("user_id", uid)
        .eq("usage_month", currentMonth)
        .maybeSingle();
      if (monthlyData) {
        setMonthlyUsed(monthlyData.credits_used);
        setMonthlyMax(monthlyData.max_credits);
        setMonthlyRemaining(monthlyData.max_credits - monthlyData.credits_used);
      } else {
        setMonthlyUsed(0);
        setMonthlyMax(30);
        setMonthlyRemaining(30);
      }
    } catch (e) {
      console.error("Error fetching credits:", e);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAvatar(session.user.id);
        checkAdmin(session.user.id);
        fetchCredits(session.user.id);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAvatar(session.user.id);
        checkAdmin(session.user.id);
        fetchCredits(session.user.id);
      } else {
        setAvatarUrl(null);
        setIsAdmin(false);
        setCreditsRemaining(5);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Listen for credit updates from the builder
  useEffect(() => {
    const handleCreditsUpdate = (e: CustomEvent) => {
      setCreditsRemaining(e.detail.remaining ?? 0);
      setMaxCredits(e.detail.max_credits ?? 5);
      if (e.detail.monthly_used !== undefined) {
        setMonthlyUsed(e.detail.monthly_used);
        setMonthlyMax(e.detail.monthly_max ?? 30);
        setMonthlyRemaining(e.detail.monthly_remaining ?? 0);
      }
    };
    window.addEventListener('credits-updated', handleCreditsUpdate as EventListener);
    return () => window.removeEventListener('credits-updated', handleCreditsUpdate as EventListener);
  }, []);

  const fetchAvatar = async (uid: string) => {
    const { data } = await supabase.from("profiles").select("avatar_url, display_name").eq("user_id", uid).maybeSingle();
    if (data?.avatar_url) setAvatarUrl(data.avatar_url);
  };

  const checkAdmin = async (uid: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
    setIsAdmin(!!data);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({ title: t("header.logoutSuccess"), description: t("header.logoutDesc") });
      navigate("/");
    } catch (error: any) {
      toast({ title: t("header.logoutError"), description: error.message, variant: "destructive" });
    }
  };

  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-8">
          <a href="https://criey.com.br/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-gradient-hero" />
            <span className="notranslate font-extrabold text-2xl md:text-4xl text-foreground drop-shadow-md" translate="no" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Criey
            </span>
          </a>
          <nav className="hidden md:flex items-center gap-6">
            <a href="https://chat.whatsapp.com/Jtwl0qmsPT44ezle5xDjbB?mode=ems_copy_t" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-smooth">
              {t("nav.community")}
            </a>
            <button onClick={() => setPricingOpen(true)} className="text-sm font-medium text-foreground/80 hover:text-foreground transition-smooth">
              {t("nav.pricing")}
            </button>
            <button onClick={() => navigate("/gallery")} className="text-sm font-medium text-foreground/80 hover:text-foreground transition-smooth">
              {t("nav.gallery")}
            </button>
            <a href="#" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-smooth">
              {t("nav.learn")}
            </a>
            <a href="#" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-smooth">
              {t("nav.marketplace")}
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-1 md:gap-3">
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 md:h-10 md:w-10" onClick={() => setLanguage(language === "pt" ? "en" : "pt")} title={language === "pt" ? "Switch to English" : "Mudar para Português"}>
            <span className="text-xs font-bold">{language === "pt" ? "PT" : "EN"}</span>
          </Button>

          <Button variant="ghost" size="icon" className="rounded-full hidden md:flex" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {user ? (
            <>
              {isAdmin && (
                <Button variant="ghost" size="icon" className="rounded-full hidden md:flex" onClick={() => navigate("/admin")} title="Admin">
                  <Shield className="h-5 w-5" />
                </Button>
              )}
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
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-lg">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">
                          {user.email?.split('@')[0] || t("header.user")}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{t("header.goPro")}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setPricingOpen(true)}>
                        {t("pricing.upgrade")}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Créditos diários</span>
                        <span className="text-sm text-muted-foreground">
                          {creditsRemaining}/{maxCredits}
                        </span>
                      </div>
                      <Progress value={maxCredits > 0 ? (creditsRemaining / maxCredits) * 100 : 0} className="h-2" />
                      <p className="text-xs text-muted-foreground">{t("header.creditsReset")}</p>
                    </div>

                    {monthlyMax < 999999 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Créditos mensais</span>
                          <span className="text-sm text-muted-foreground">
                            {monthlyRemaining}/{monthlyMax}
                          </span>
                        </div>
                        <Progress value={monthlyMax > 0 ? (monthlyRemaining / monthlyMax) * 100 : 0} className="h-2" />
                        {monthlyRemaining <= 0 ? (
                          <p className="text-xs text-destructive font-medium">
                            ⚠️ Créditos mensais esgotados. Renova dia 1 do próximo mês.
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {monthlyUsed}/{monthlyMax} usados este mês
                          </p>
                        )}
                      </div>
                    )}

                    <Separator />

                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="ghost" className="justify-start" size="sm" onClick={() => navigate("/profile")}>
                        <Settings className="h-4 w-4 mr-2" />
                        {t("header.settings")}
                      </Button>
                      <Button variant="ghost" className="justify-start" size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        {t("header.invite")}
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-1">
                      <Button variant="ghost" className="w-full justify-start" size="sm">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        {t("header.help")}
                      </Button>
                      <Button variant="ghost" className="w-full justify-between" size="sm" onClick={toggleTheme}>
                        <div className="flex items-center">
                          {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                          {theme === "dark" ? t("header.lightMode") : t("header.darkMode")}
                        </div>
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                      {isAdmin && (
                        <Button variant="ghost" className="w-full justify-start" size="sm" onClick={() => navigate("/admin")}>
                          <Shield className="h-4 w-4 mr-2" />
                          Admin
                        </Button>
                      )}
                    </div>

                    <Separator />

                    <Button
                      variant="ghost"
                      className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                      size="sm"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {t("header.logout")}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate("/auth")} size="sm" className="text-sm px-3">
                {t("nav.login")}
              </Button>
              <Button onClick={() => navigate("/auth")} size="sm" className="text-sm px-3 md:px-6">
                {t("nav.signup")}
              </Button>
            </>
          )}
        </div>
      </div>

      <PricingDialog open={pricingOpen} onOpenChange={setPricingOpen} />
    </header>
  );
};
export default Header;
