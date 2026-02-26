import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Ban, Trash2, UserCog, Eye, Unlock, Plus } from "lucide-react";

export interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  banned: boolean;
  plan: string;
  subscription_id: string | null;
  stripe_subscription_id: string | null;
  roles: string[];
  credits_used: number;
  max_credits: number;
}

interface AdminUserTableProps {
  users: AdminUser[];
  loading: boolean;
  onAction: (action: string, userId: string, extra?: any) => Promise<void>;
}

export function AdminUserTable({ users, loading, onAction }: AdminUserTableProps) {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [creditsDialogOpen, setCreditsDialogOpen] = useState(false);
  const [newPlan, setNewPlan] = useState("free");
  const [creditsAmount, setCreditsAmount] = useState("10");
  const [confirmAction, setConfirmAction] = useState<{ type: "block" | "delete"; user: AdminUser } | null>(null);

  const filtered = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary">{users.length} usuários</Badge>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Créditos Hoje</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.display_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.banned ? (
                      <Badge variant="destructive">Bloqueado</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Ativo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{user.plan}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {user.credits_used}/{user.max_credits >= 999999 ? "∞" : user.max_credits}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(user); setDetailsOpen(true); }} title="Detalhes">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(user); setNewPlan(user.plan); setPlanDialogOpen(true); }} title="Alterar plano">
                        <UserCog className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(user); setCreditsDialogOpen(true); }} title="Adicionar créditos">
                        <Plus className="h-4 w-4 text-blue-500" />
                      </Button>
                      {user.banned ? (
                        <Button variant="ghost" size="icon" onClick={() => onAction("unblock", user.id)} title="Desbloquear">
                          <Unlock className="h-4 w-4 text-green-600" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => setConfirmAction({ type: "block", user })} title="Bloquear">
                          <Ban className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => setConfirmAction({ type: "delete", user })} title="Excluir">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-3 text-sm">
              <div><span className="font-medium">ID:</span> {selectedUser.id}</div>
              <div><span className="font-medium">Nome:</span> {selectedUser.display_name}</div>
              <div><span className="font-medium">Email:</span> {selectedUser.email}</div>
              <div><span className="font-medium">Celular:</span> {selectedUser.phone || "Não informado"}</div>
              <div><span className="font-medium">Plano:</span> <Badge variant="outline" className="capitalize">{selectedUser.plan}</Badge></div>
              <div><span className="font-medium">Créditos hoje:</span> {selectedUser.credits_used}/{selectedUser.max_credits >= 999999 ? "∞" : selectedUser.max_credits}</div>
              <div><span className="font-medium">Status:</span> {selectedUser.banned ? "Bloqueado" : "Ativo"}</div>
              <div><span className="font-medium">Cadastro:</span> {new Date(selectedUser.created_at).toLocaleString("pt-BR")}</div>
              <div><span className="font-medium">Último login:</span> {selectedUser.last_sign_in_at ? new Date(selectedUser.last_sign_in_at).toLocaleString("pt-BR") : "Nunca"}</div>
              <div><span className="font-medium">Roles:</span> {selectedUser.roles.join(", ") || "Nenhuma"}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Plan Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Plano</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Usuário: <span className="font-medium text-foreground">{selectedUser?.email}</span>
          </p>
          <Select value={newPlan} onValueChange={setNewPlan}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Gratuito</SelectItem>
              <SelectItem value="start">Start</SelectItem>
              <SelectItem value="pro">Pró</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => {
              if (selectedUser) {
                onAction("change_plan", selectedUser.id, { new_plan: newPlan });
                setPlanDialogOpen(false);
              }
            }}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Credits Dialog */}
      <Dialog open={creditsDialogOpen} onOpenChange={setCreditsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Créditos</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Usuário: <span className="font-medium text-foreground">{selectedUser?.email}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Créditos atuais: {selectedUser?.credits_used}/{selectedUser?.max_credits && selectedUser.max_credits >= 999999 ? "∞" : selectedUser?.max_credits}
          </p>
          <Input
            type="number"
            min="1"
            value={creditsAmount}
            onChange={(e) => setCreditsAmount(e.target.value)}
            placeholder="Quantidade de créditos"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => {
              if (selectedUser) {
                onAction("add_credits", selectedUser.id, { credits_amount: parseInt(creditsAmount) || 10 });
                setCreditsDialogOpen(false);
              }
            }}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Confirm Block/Delete Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "delete" ? "Excluir usuário" : "Bloquear usuário"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "delete"
                ? `Tem certeza que deseja excluir o usuário "${confirmAction?.user.email}"? Esta ação não pode ser desfeita.`
                : `Tem certeza que deseja bloquear o usuário "${confirmAction?.user.email}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmAction) {
                  onAction(confirmAction.type === "delete" ? "delete" : "block", confirmAction.user.id);
                  setConfirmAction(null);
                }
              }}
            >
              {confirmAction?.type === "delete" ? "Excluir" : "Bloquear"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
