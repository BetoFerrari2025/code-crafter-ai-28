import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, Star, Crown } from "lucide-react";

interface PlanStats {
  free: number;
  start: number;
  pro: number;
  premium: number;
  total: number;
}

interface AdminStatsProps {
  planStats: PlanStats | null;
}

export function AdminStats({ planStats }: AdminStatsProps) {
  if (!planStats) return <div className="text-muted-foreground text-center py-12">Carregando...</div>;

  const cards = [
    { label: "Total de Usuários", value: planStats.total, icon: Users, color: "text-primary" },
    { label: "Plano Gratuito", value: planStats.free, icon: Users, color: "text-muted-foreground" },
    { label: "Plano Start", value: planStats.start, icon: CreditCard, color: "text-blue-500" },
    { label: "Plano Pró", value: planStats.pro, icon: Star, color: "text-yellow-500" },
    { label: "Plano Premium", value: planStats.premium, icon: Crown, color: "text-purple-500" },
  ];

  const paidTotal = planStats.start + planStats.pro + planStats.premium;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Estatísticas de Planos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Resumo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Assinantes (pagos)</span>
            <span className="font-semibold">{paidTotal}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gratuitos</span>
            <span className="font-semibold">{planStats.free}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Taxa de conversão</span>
            <span className="font-semibold">
              {planStats.total > 0 ? ((paidTotal / planStats.total) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
