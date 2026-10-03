import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { productImage } from "@/lib/catalog";
import { AField, Card, ImageUpload, Input, PageTitle, Textarea, Toggle } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/products/$id")({ component: EditProduct });

const empty = {
  slug: "", category_id: "" as string | null, name_fr: "", name_ar: "", tagline_fr: "", tagline_ar: "",
  description_fr: "", description_ar: "", ingredients_fr: "", ingredients_ar: "", usage_fr: "", usage_ar: "",
  benefits_fr: "", benefits_ar: "", warnings_fr: "", warnings_ar: "", size: "", sku: "", badge: "",
  price: 0, compare_at_price: null as number | null, stock: 0, low_stock_threshold: 5, image: "", gallery: [] as string[],
  is_featured: false, is_bestseller: false, is_new: false, is_active: true,
};

const slugify = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

function EditProduct() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [f, setF] = useState(empty);
  const [saving, setSaving] = useState(false);
  const cats = useQuery({ queryKey: ["admin-cats"], queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [] });
  const prod = useQuery({ queryKey: ["admin-product", id], enabled: !isNew, queryFn: async () => (await supabase.from("products").select("*").eq("id", id).maybeSingle()).data });

  useEffect(() => {
    if (prod.data) {
      const { id: _i, created_at: _c, ...rest } = prod.data;
      setF({ ...empty, ...rest, price: Number(rest.price), compare_at_price: rest.compare_at_price ? Number(rest.compare_at_price) : null });
    }
  }, [prod.data]);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const txt = (k: keyof typeof f, label: string, area = false) => (
    <AField label={label}>
      {area ? <Textarea value={String(f[k] ?? "")} onChange={(e) => set(k, e.target.value as never)} /> : <Input value={String(f[k] ?? "")} onChange={(e) => set(k, e.target.value as never)} />}
    </AField>
  );

  const save = async () => {
    if (!f.name_fr.trim() || !f.name_ar.trim() || f.price <= 0) return toast.error("Nom FR, nom AR et prix sont obligatoires.");
    setSaving(true);
    const payload = { ...f, slug: f.slug.trim() || slugify(f.name_fr), category_id: f.category_id || null };
    const res = isNew ? await supabase.from("products").insert(payload).select("id").single() : await supabase.from("products").update(payload).eq("id", id).select("id").single();
    setSaving(false);
    if (res.error) return toast.error(res.error.message.includes("duplicate") ? "Ce lien (slug) existe déjà." : res.error.message);
    toast.success("Produit enregistré");
    qc.invalidateQueries();
    if (isNew) navigate({ to: "/admin/products/$id", params: { id: res.data.id } });
  };

  const remove = async () => {
    if (!confirm("Supprimer définitivement ce produit ?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    navigate({ to: "/admin/products" });
  };

  return (
    <div>
      <Link to="/admin/products" className="text-xs link-lux">← Produits</Link>
      <PageTitle title={isNew ? "Nouveau produit" : f.name_fr || "Produit"}>
        {!isNew && <button onClick={remove} className="text-xs text-destructive link-lux">Supprimer</button>}
        <button onClick={save} disabled={saving} className="btn-lux !px-6 !py-2.5">{saving ? "…" : "Enregistrer"}</button>
      </PageTitle>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card className="grid gap-5 md:grid-cols-2">
            {txt("name_fr", "Nom (FR)")}{txt("name_ar", "Nom (AR)")}
            {txt("tagline_fr", "Accroche (FR)")}{txt("tagline_ar", "Accroche (AR)")}
            {txt("description_fr", "Description (FR)", true)}{txt("description_ar", "Description (AR)", true)}
            {txt("benefits_fr", "Bienfaits (FR)", true)}{txt("benefits_ar", "Bienfaits (AR)", true)}
            {txt("ingredients_fr", "Ingrédients (FR)", true)}{txt("ingredients_ar", "Ingrédients (AR)", true)}
            {txt("usage_fr", "Utilisation (FR)", true)}{txt("usage_ar", "Utilisation (AR)", true)}
            {txt("warnings_fr", "Précautions (FR)", true)}{txt("warnings_ar", "Précautions (AR)", true)}
          </Card>
          <Card>
            <ImageUpload label="Image principale" value={f.image ? productImage(f.image) : ""} onChange={(v) => set("image", v)} />
            <p className="eyebrow mt-6">Galerie</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {f.gallery.map((g, i) => (
                <div key={i} className="relative">
                  <img src={g} alt="" className="h-20 w-16 object-cover" />
                  <button onClick={() => set("gallery", f.gallery.filter((_, j) => j !== i))} className="absolute -end-2 -top-2 h-5 w-5 rounded-full bg-foreground text-xs text-background">×</button>
                </div>
              ))}
            </div>
            <div className="mt-3"><ImageUpload label="Ajouter à la galerie" value="" onChange={(v) => v && set("gallery", [...f.gallery, v])} /></div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="space-y-5">
            <AField label="Catégorie">
              <select value={f.category_id ?? ""} onChange={(e) => set("category_id", e.target.value)} className="w-full border border-input bg-background px-3 py-2 text-sm">
                <option value="">—</option>
                {cats.data?.map((c) => <option key={c.id} value={c.id}>{c.name_fr}</option>)}
              </select>
            </AField>
            <div className="grid grid-cols-2 gap-4">
              <AField label="Prix (MAD)"><Input type="number" min={0} value={f.price} onChange={(e) => set("price", Number(e.target.value))} /></AField>
              <AField label="Ancien prix"><Input type="number" min={0} value={f.compare_at_price ?? ""} onChange={(e) => set("compare_at_price", e.target.value ? Number(e.target.value) : null)} /></AField>
              <AField label="Stock"><Input type="number" min={0} value={f.stock} onChange={(e) => set("stock", Math.max(0, parseInt(e.target.value) || 0))} /></AField>
              <AField label="Alerte stock"><Input type="number" min={0} value={f.low_stock_threshold} onChange={(e) => set("low_stock_threshold", parseInt(e.target.value) || 0)} /></AField>
            </div>
            {txt("sku", "SKU")}{txt("size", "Contenance (ex. 30 ml)")}{txt("badge", "Badge (ex. Édition limitée)")}{txt("slug", "Lien (slug)")}
          </Card>
          <Card className="space-y-3">
            <Toggle label="En ligne" checked={f.is_active} onChange={(v) => set("is_active", v)} />
            <Toggle label="Mis en avant" checked={f.is_featured} onChange={(v) => set("is_featured", v)} />
            <Toggle label="Best-seller" checked={f.is_bestseller} onChange={(v) => set("is_bestseller", v)} />
            <Toggle label="Nouveauté" checked={f.is_new} onChange={(v) => set("is_new", v)} />
          </Card>
        </div>
      </div>
    </div>
  );
}
