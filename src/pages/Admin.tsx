import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Shield, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminSidebar, type AdminView } from "@/components/admin/AdminSidebar";
import { AdminMarketplace } from "@/components/admin/AdminMarketplace";
import { AdminUserTable, type AdminUser } from "@/components/admin/AdminUserTable";
import { AdminStats } from "@/components/admin/AdminStats";
import { AdminOnline } from "@/components/admin/AdminOnline";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";

interface PlanStats {
  free: number;
  start: number;
  pro: number;
  premium: number;
  total: number;
}

const Admin = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState<AdminView>("users");
  const [planStats, setPlanStats] = useState<PlanStats | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => { checkAdmin(); }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase.channel("admin-presence", {
      config: { presence: { key: "admin-tracker" } },
    });
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const count = Object.values(state).flat().length;
        setOnlineCount(count);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!data) { navigate("/"); return; }
    setIsAdmin(true);
    fetchUsers();
  };

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "list" },
    });
    if (error) {
      toast({ title: t("admin.error"), description: error.message, variant: "destructive" });
    } else {
      setUsers(data.users || []);
      setPlanStats(data.planStats || null);
    }
    setLoading(false);
  };

  const handleAction = async (action: string, userId: string, extra?: any) => {
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action, target_user_id: userId, ...extra },
    });
    if (error || data?.error) {
      toast({ title: t("admin.error"), description: data?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: t("admin.success"), description: t("admin.actionExecuted") });
      fetchUsers();
    }
  };

  if (!isAdmin) return null;

  const renderContent = () => {
    switch (currentView) {
      case "users":
        return <AdminUserTable users={users} loading={loading} onAction={handleAction} />;
      case "stats":
        return <AdminStats planStats={planStats} />;
      case "credits":
        return <AdminUserTable users={users} loading={loading} onAction={handleAction} />;
      case "online":
        return <AdminOnline onlineCount={onlineCount} />;
      case "marketplace":
        return <AdminMarketplace />;
      default:
        return null;
    }
  };

  const viewTitles: Record<AdminView, string> = {
    users: t("admin.manageUsers"),
    stats: t("admin.stats"),
    credits: t("admin.manageCredits"),
    online: t("admin.online"),
    marketplace: t("marketplace.title"),
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16 flex">
        <div className="hidden md:block">
          <AdminSidebar currentView={currentView} onViewChange={setCurrentView} planStats={planStats} onlineCount={onlineCount} />
        </div>
        <div className="md:hidden fixed bottom-4 left-4 z-50">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" className="rounded-full shadow-lg">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="pt-8">
                <AdminSidebar currentView={currentView} onViewChange={setCurrentView} planStats={planStats} onlineCount={onlineCount} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <main className="flex-1 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">{viewTitles[currentView]}</h1>
          </div>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Admin;
