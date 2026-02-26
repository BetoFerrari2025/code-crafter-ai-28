import { Users, BarChart3, CreditCard, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminView = "users" | "stats" | "credits" | "online";

interface AdminSidebarProps {
  currentView: AdminView;
  onViewChange: (view: AdminView) => void;
  planStats: { free: number; start: number; pro: number; premium: number; total: number } | null;
  onlineCount: number;
}

const menuItems = [
  { id: "users" as AdminView, label: "Usuários", icon: Users },
  { id: "stats" as AdminView, label: "Estatísticas de Planos", icon: BarChart3 },
  { id: "credits" as AdminView, label: "Créditos", icon: CreditCard },
  { id: "online" as AdminView, label: "Usuários Online", icon: Activity },
];

export function AdminSidebar({ currentView, onViewChange, planStats, onlineCount }: AdminSidebarProps) {
  return (
    <aside className="w-64 border-r bg-card min-h-[calc(100vh-5rem)] p-4 space-y-2">{/* hidden on mobile handled by parent */}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-3">
        Painel Admin
      </h2>
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onViewChange(item.id)}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            currentView === item.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <item.icon className="h-4 w-4" />
          <span>{item.label}</span>
          {item.id === "online" && (
            <span className="ml-auto bg-green-500 text-white text-xs rounded-full px-2 py-0.5">
              {onlineCount}
            </span>
          )}
          {item.id === "users" && planStats && (
            <span className="ml-auto text-xs opacity-70">{planStats.total}</span>
          )}
        </button>
      ))}
    </aside>
  );
}
