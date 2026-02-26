import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface AdminOnlineProps {
  onlineCount: number;
}

export function AdminOnline({ onlineCount }: AdminOnlineProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Usuários Online</h2>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Acessando agora</CardTitle>
          <Activity className="h-5 w-5 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-bold text-green-500">{onlineCount}</div>
          <p className="text-sm text-muted-foreground mt-2">usuários conectados em tempo real</p>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Atualizado automaticamente a cada 30 segundos via Realtime.
      </p>
    </div>
  );
}
