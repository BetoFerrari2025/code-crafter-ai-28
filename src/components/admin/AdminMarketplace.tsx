import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Plus, Pencil, Trash2, ImagePlus, ExternalLink } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Product {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  button_text: string | null;
  button_link: string | null;
  button_color: string | null;
  is_active: boolean;
  sort_order: number;
}

const defaultProduct: Omit<Product, "id"> = {
  title: "",
  description: "",
  image_url: null,
  button_text: "Comprar",
  button_link: "",
  button_color: "#7c3aed",
  is_active: true,
  sort_order: 0,
};

export function AdminMarketplace() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(defaultProduct);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    // Use service role via edge function or direct query (admin RLS allows)
    const { data, error } = await supabase
      .from("marketplace_products" as any)
      .select("*")
      .order("sort_order", { ascending: true });
    if (!error) setProducts((data as any) || []);
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm(defaultProduct);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      title: p.title,
      description: p.description || "",
      image_url: p.image_url,
      button_text: p.button_text || "Comprar",
      button_link: p.button_link || "",
      button_color: p.button_color || "#7c3aed",
      is_active: p.is_active,
      sort_order: p.sort_order,
    });
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("products").upload(path, file);
    if (error) {
      toast({ title: t("admin.error"), description: error.message, variant: "destructive" });
    } else {
      const { data: urlData } = supabase.storage.from("products").getPublicUrl(path);
      setForm(f => ({ ...f, image_url: urlData.publicUrl }));
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: t("admin.error"), description: t("marketplace.titleRequired"), variant: "destructive" });
      return;
    }

    if (editing) {
      const { error } = await supabase
        .from("marketplace_products" as any)
        .update({
          title: form.title,
          description: form.description || null,
          image_url: form.image_url,
          button_text: form.button_text,
          button_link: form.button_link,
          button_color: form.button_color,
          is_active: form.is_active,
          sort_order: form.sort_order,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", editing.id);
      if (error) {
        toast({ title: t("admin.error"), description: error.message, variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase
        .from("marketplace_products" as any)
        .insert({
          title: form.title,
          description: form.description || null,
          image_url: form.image_url,
          button_text: form.button_text,
          button_link: form.button_link,
          button_color: form.button_color,
          is_active: form.is_active,
          sort_order: form.sort_order,
        } as any);
      if (error) {
        toast({ title: t("admin.error"), description: error.message, variant: "destructive" });
        return;
      }
    }

    toast({ title: t("admin.success"), description: t("marketplace.saved") });
    setDialogOpen(false);
    fetchProducts();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase
      .from("marketplace_products" as any)
      .delete()
      .eq("id", deleteId);
    if (error) {
      toast({ title: t("admin.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("admin.success"), description: t("marketplace.deleted") });
      fetchProducts();
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("marketplace.products")}</h2>
        <Button onClick={openNew} size="sm">
          <Plus className="h-4 w-4 mr-1" /> {t("marketplace.addProduct")}
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">{t("admin.loading")}</p>
      ) : products.length === 0 ? (
        <p className="text-muted-foreground">{t("marketplace.empty")}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              {p.image_url && (
                <img src={p.image_url} alt={p.title} className="w-full h-40 object-cover" />
              )}
              {!p.image_url && (
                <div className="w-full h-40 bg-muted flex items-center justify-center">
                  <ImagePlus className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold truncate">{p.title}</h3>
                  {!p.is_active && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">{t("marketplace.inactive")}</span>
                  )}
                </div>
                {p.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                )}
                {p.button_text && (
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block text-xs text-white px-3 py-1 rounded"
                      style={{ backgroundColor: p.button_color || "#7c3aed" }}
                    >
                      {p.button_text}
                    </span>
                    {p.button_link && (
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                    <Pencil className="h-3 w-3 mr-1" /> {t("marketplace.edit")}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteId(p.id)}>
                    <Trash2 className="h-3 w-3 mr-1" /> {t("marketplace.delete")}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("marketplace.editProduct") : t("marketplace.addProduct")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Image */}
            <div>
              <label className="text-sm font-medium">{t("marketplace.image")}</label>
              {form.image_url && (
                <img src={form.image_url} alt="" className="w-full h-40 object-cover rounded mt-1" />
              )}
              <div className="mt-2">
                <label className="cursor-pointer inline-flex items-center gap-2 text-sm px-3 py-2 border rounded hover:bg-muted transition-colors">
                  <ImagePlus className="h-4 w-4" />
                  {uploading ? t("admin.loading") : t("marketplace.uploadImage")}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-sm font-medium">{t("marketplace.title")}</label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder={t("marketplace.titlePlaceholder")}
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium">{t("marketplace.description")}</label>
              <Textarea
                value={form.description || ""}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder={t("marketplace.descriptionPlaceholder")}
                rows={3}
              />
            </div>

            {/* Button Text */}
            <div>
              <label className="text-sm font-medium">{t("marketplace.buttonText")}</label>
              <Input
                value={form.button_text || ""}
                onChange={e => setForm(f => ({ ...f, button_text: e.target.value }))}
                placeholder={t("marketplace.buttonTextPlaceholder")}
              />
            </div>

            {/* Button Link */}
            <div>
              <label className="text-sm font-medium">{t("marketplace.buttonLink")}</label>
              <Input
                value={form.button_link || ""}
                onChange={e => setForm(f => ({ ...f, button_link: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            {/* Button Color */}
            <div>
              <label className="text-sm font-medium">{t("marketplace.buttonColor")}</label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="color"
                  value={form.button_color || "#7c3aed"}
                  onChange={e => setForm(f => ({ ...f, button_color: e.target.value }))}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">{form.button_color}</span>
                {/* Preview */}
                <span
                  className="text-xs text-white px-3 py-1 rounded"
                  style={{ backgroundColor: form.button_color || "#7c3aed" }}
                >
                  {form.button_text || "Button"}
                </span>
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                id="is_active"
              />
              <label htmlFor="is_active" className="text-sm">{t("marketplace.activeProduct")}</label>
            </div>

            {/* Sort order */}
            <div>
              <label className="text-sm font-medium">{t("marketplace.sortOrder")}</label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("admin.cancel")}</Button>
            <Button onClick={handleSave}>{t("marketplace.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("marketplace.deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("marketplace.deleteWarning")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t("marketplace.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
