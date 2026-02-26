import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Ban, Trash2, UserCog, Eye, Unlock, Plus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

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
  country: string | null;
}

interface AdminUserTableProps {
  users: AdminUser[];
  loading: boolean;
  onAction: (action: string, userId: string, extra?: any) => Promise<void>;
}

const LOCALE_TO_COUNTRY: Record<string, { name: string; flag: string }> = {
  "pt-BR": { name: "Brasil", flag: "🇧🇷" },
  "pt-PT": { name: "Portugal", flag: "🇵🇹" },
  "pt": { name: "Brasil", flag: "🇧🇷" },
  "en-US": { name: "United States", flag: "🇺🇸" },
  "en-GB": { name: "United Kingdom", flag: "🇬🇧" },
  "en": { name: "United States", flag: "🇺🇸" },
  "es-ES": { name: "España", flag: "🇪🇸" },
  "es-MX": { name: "México", flag: "🇲🇽" },
  "es-AR": { name: "Argentina", flag: "🇦🇷" },
  "es-CO": { name: "Colombia", flag: "🇨🇴" },
  "es": { name: "España", flag: "🇪🇸" },
  "fr-FR": { name: "France", flag: "🇫🇷" },
  "fr": { name: "France", flag: "🇫🇷" },
  "de-DE": { name: "Deutschland", flag: "🇩🇪" },
  "de": { name: "Deutschland", flag: "🇩🇪" },
  "it-IT": { name: "Italia", flag: "🇮🇹" },
  "it": { name: "Italia", flag: "🇮🇹" },
  "ja-JP": { name: "Japan", flag: "🇯🇵" },
  "ja": { name: "Japan", flag: "🇯🇵" },
  "ko-KR": { name: "South Korea", flag: "🇰🇷" },
  "ko": { name: "South Korea", flag: "🇰🇷" },
  "zh-CN": { name: "China", flag: "🇨🇳" },
  "zh-TW": { name: "Taiwan", flag: "🇹🇼" },
  "zh": { name: "China", flag: "🇨🇳" },
  "ru-RU": { name: "Russia", flag: "🇷🇺" },
  "ru": { name: "Russia", flag: "🇷🇺" },
  "ar": { name: "Arabic", flag: "🇸🇦" },
  "hi-IN": { name: "India", flag: "🇮🇳" },
  "hi": { name: "India", flag: "🇮🇳" },
  "nl-NL": { name: "Netherlands", flag: "🇳🇱" },
  "nl": { name: "Netherlands", flag: "🇳🇱" },
  "tr-TR": { name: "Türkiye", flag: "🇹🇷" },
  "tr": { name: "Türkiye", flag: "🇹🇷" },
  "pl-PL": { name: "Polska", flag: "🇵🇱" },
  "pl": { name: "Polska", flag: "🇵🇱" },
};

function getCountryFromLocale(locale: string | null): { name: string; flag: string } {
  if (!locale) return { name: "—", flag: "🌍" };
  const match = LOCALE_TO_COUNTRY[locale] || LOCALE_TO_COUNTRY[locale.split("-")[0]];
  return match || { name: locale, flag: "🌍" };
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
  const { t, language } = useLanguage();

  const filtered = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  const dateFmt = language === "pt" ? "pt-BR" : "en-US";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("admin.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Badge variant="secondary">{users.length} {t("admin.usersCount")}</Badge>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">{t("admin.loading")}</div>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.name")}</TableHead>
                <TableHead>{t("admin.email")}</TableHead>
                <TableHead>{t("admin.country")}</TableHead>
                <TableHead>{t("admin.status")}</TableHead>
                <TableHead>{t("admin.plan")}</TableHead>
                <TableHead>{t("admin.creditsToday")}</TableHead>
                <TableHead>{t("admin.registered")}</TableHead>
                <TableHead className="text-right">{t("admin.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => {
                const country = getCountryFromLocale(user.country);
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.display_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm">
                        <span>{country.flag}</span>
                        <span>{country.name}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.banned ? (
                        <Badge variant="destructive">{t("admin.blocked")}</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{t("admin.active")}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{user.plan}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{user.credits_used}/{user.max_credits >= 999999 ? "∞" : user.max_credits}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString(dateFmt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(user); setDetailsOpen(true); }} title={t("admin.details")}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(user); setNewPlan(user.plan); setPlanDialogOpen(true); }} title={t("admin.changePlan")}>
                          <UserCog className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(user); setCreditsDialogOpen(true); }} title={t("admin.addCredits")}>
                          <Plus className="h-4 w-4 text-blue-500" />
                        </Button>
                        {user.banned ? (
                          <Button variant="ghost" size="icon" onClick={() => onAction("unblock", user.id)} title={t("admin.unblock")}>
                            <Unlock className="h-4 w-4 text-green-600" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={() => setConfirmAction({ type: "block", user })} title={t("admin.block")}>
                            <Ban className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => setConfirmAction({ type: "delete", user })} title={t("admin.delete")}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.details")}</DialogTitle>
          </DialogHeader>
          {selectedUser && (() => {
            const country = getCountryFromLocale(selectedUser.country);
            return (
              <div className="space-y-3 text-sm">
                <div><span className="font-medium">ID:</span> {selectedUser.id}</div>
                <div><span className="font-medium">{t("admin.name")}:</span> {selectedUser.display_name}</div>
                <div><span className="font-medium">{t("admin.email")}:</span> {selectedUser.email}</div>
                <div><span className="font-medium">{t("admin.country")}:</span> {country.flag} {country.name}</div>
                <div><span className="font-medium">{t("admin.phone")}:</span> {selectedUser.phone || t("admin.notProvided")}</div>
                <div><span className="font-medium">{t("admin.plan")}:</span> <Badge variant="outline" className="capitalize">{selectedUser.plan}</Badge></div>
                <div><span className="font-medium">{t("admin.creditsToday")}:</span> {selectedUser.credits_used}/{selectedUser.max_credits >= 999999 ? "∞" : selectedUser.max_credits}</div>
                <div><span className="font-medium">{t("admin.status")}:</span> {selectedUser.banned ? t("admin.blocked") : t("admin.active")}</div>
                <div><span className="font-medium">{t("admin.registered")}:</span> {new Date(selectedUser.created_at).toLocaleString(dateFmt)}</div>
                <div><span className="font-medium">{t("admin.lastLogin")}:</span> {selectedUser.last_sign_in_at ? new Date(selectedUser.last_sign_in_at).toLocaleString(dateFmt) : t("admin.never")}</div>
                <div><span className="font-medium">{t("admin.roles")}:</span> {selectedUser.roles.join(", ") || t("admin.none")}</div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Change Plan Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.changePlan")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("admin.user")}: <span className="font-medium text-foreground">{selectedUser?.email}</span>
          </p>
          <Select value={newPlan} onValueChange={setNewPlan}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="free">{t("pricing.free")}</SelectItem>
              <SelectItem value="start">Start</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>{t("admin.cancel")}</Button>
            <Button onClick={() => {
              if (selectedUser) {
                onAction("change_plan", selectedUser.id, { new_plan: newPlan });
                setPlanDialogOpen(false);
              }
            }}>{t("admin.confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Credits Dialog */}
      <Dialog open={creditsDialogOpen} onOpenChange={setCreditsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.addCredits")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("admin.user")}: <span className="font-medium text-foreground">{selectedUser?.email}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {t("admin.currentCredits")}: {selectedUser?.credits_used}/{selectedUser?.max_credits && selectedUser.max_credits >= 999999 ? "∞" : selectedUser?.max_credits}
          </p>
          <Input type="number" min="1" value={creditsAmount} onChange={(e) => setCreditsAmount(e.target.value)} placeholder={t("admin.creditsAmount")} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditsDialogOpen(false)}>{t("admin.cancel")}</Button>
            <Button onClick={() => {
              if (selectedUser) {
                onAction("add_credits", selectedUser.id, { credits_amount: parseInt(creditsAmount) || 10 });
                setCreditsDialogOpen(false);
              }
            }}>{t("admin.add")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Block/Delete Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "delete" ? t("admin.deleteUser") : t("admin.blockUser")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "delete"
                ? `${t("admin.deleteConfirm")} "${confirmAction?.user.email}"? ${t("admin.deleteWarning")}`
                : `${t("admin.blockConfirm")} "${confirmAction?.user.email}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmAction) {
                  onAction(confirmAction.type === "delete" ? "delete" : "block", confirmAction.user.id);
                  setConfirmAction(null);
                }
              }}
            >
              {confirmAction?.type === "delete" ? t("admin.delete") : t("admin.block")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
