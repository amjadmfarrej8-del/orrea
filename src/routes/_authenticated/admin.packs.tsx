import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { productImage } from "@/lib/catalog";
import { AField, Card, ImageUpload, Input, PageTitle, Toggle } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/packs")({ component: PacksAdmin });

type Item = { product_id: string; quantity: number };
type Draft = {
  id?: string; name_fr: string; name_ar: string; tagline_fr: string; tagline_ar: string; badge: string;
  price: string; compare_at_price: string; free_shipping: boolean; is_active: boolean; image: string;
  pack_sort_order: number; bundle_items: Item[];
};
const empty: Draft = { name_fr: "", name_ar: "", tagline_fr: "", tagline_ar: "", badge: "Offre exclusive", price: "", compare_at_price: "", free_shipping: true, is_active: true, image: "", pack_sort_order: 0, bundle_items: [] };
const slugify = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function PacksAdmin() {
  const qc = useQueryClient();
  const all = useQuery({ queryKey: ["admin-packs"], queryFn: async () => {
    const { data, error } = await supabase.from("products").select("*").order("pack_sort_order");
    if (error) throw error;
    return data;
  } });
  const [edit, setEdit] = useState<Draft | null>(null);
  const packs = (all.data ?? []).filter((p) => Array.isArray(p.bundle_items) && p.bundle_items.length > 0);
  const singles = (all.data ?? []).filter((p) => !(Array.isArray(p.bundle_items) && p.bundle_items.length > 0));
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-packs"] }); qc.invalidateQueries({ queryKey: ["products"] }); };

  const save = async () => {
    if (!edit) return;
    const price = Number(edit.price);
    if (edit.name_fr.trim().length < 2 || !edit.name_ar.trim()) { toast.error("Titre FR et AR requis"); return; }
    if (!(price > 0)) { toast.error("Prix invalide"); return; }
    if (!edit.bundle_items.length) { toast.error("Choisissez au moins un produit"); return; }
    const row = {
      name_fr: edit.name_fr.trim(), name_ar: edit.name_ar.trim(), tagline_fr: edit.tagline_fr, tagline_ar: edit.tagline_ar, badge: edit.badge,
      price, compare_at_price: edit.compare_at_price ? Number(edit.compare_at_price) : null, free_shipping: edit.free_shipping,
      is_active: edit.is_active, image: edit.image, pack_sort_order: edit.pack_sort_order, bundle_items: edit.bundle_items as never,
    };
    const res = edit.id
      ? await supabase.from("products").update(row).eq("id", edit.id)
      : await supabase.from("products").insert({ ...row, slug: `${slugify(edit.name_fr)}-${Date.now().toString(36)}`, sku: "PACK", is_featured: true });
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("Pack enregistré");
    setEdit(null); refresh();
  };
  const remove = async (id: string) => {
    if (!confirm("Supprimer ce pack ?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      await supabase.from("products").update({ is_active: false }).eq("id", id);
      toast.message("Ce pack a déjà été commandé : il a été désactivé au lieu d'être supprimé.");
    } else toast.success("Pack supprimé");
    refresh();
  };
  const move = async (i: number, d: number) => {
    const a = [...packs]; const j = i + d; if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j]!, a[i]!];
    await Promise.all(a.map((p, k) => supabase.from("products").update({ pack_sort_order: k + 1 }).eq("id", p.id)));
    refresh();
  };

  return (
    <div>
      <PageTitle title="Packs / Offres">
        <button onClick={() => setEdit({ ...empty, pack_sort_order: packs.length + 1 })} className="btn-lux !px-6 !py-2.5">Nouveau pack</button>
      </PageTitle>
      <p className="mb-6 text-sm text-muted-foreground">Les packs actifs s'affichent dans la section « Offres » de la page d'accueil. Sa position se règle dans Page d'accueil.</p>

      {edit && (
        <Card className="mb-8 grid gap-4 md:grid-cols-2">
          <AField label="Titre (FR)"><Input value={edit.name_fr} onChange={(e) => setEdit({ ...edit, name_fr: e.target.value })} /></AField>
          <AField label="Titre (AR)"><Input dir="rtl" value={edit.name_ar} onChange={(e) => setEdit({ ...edit, name_ar: e.target.value })} /></AField>
          <AField label="Petit texte (FR)"><Input value={edit.tagline_fr} onChange={(e) => setEdit({ ...edit, tagline_fr: e.target.value })} /></AField>
          <AField label="Petit texte (AR)"><Input dir="rtl" value={edit.tagline_ar} onChange={(e) => setEdit({ ...edit, tagline_ar: e.target.value })} /></AField>
          <AField label="Badge"><Input value={edit.badge} onChange={(e) => setEdit({ ...edit, badge: e.target.value })} /></AField>
          <AField label="Ordre d'affichage"><Input type="number" value={edit.pack_sort_order} onChange={(e) => setEdit({ ...edit, pack_sort_order: Number(e.target.value) })} /></AField>
          <AField label="Prix du pack (MAD)"><Input type="number" min="0" value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value })} /></AField>
          <AField label="Prix barré / d'origine (optionnel)"><Input type="number" min="0" value={edit.compare_at_price} onChange={(e) => setEdit({ ...edit, compare_at_price: e.target.value })} /></AField>
          <div className="space-y-3">
            <Toggle checked={edit.free_shipping} onChange={(v) => setEdit({ ...edit, free_shipping: v })} label="Livraison gratuite" />
            <Toggle checked={edit.is_active} onChange={(v) => setEdit({ ...edit, is_active: v })} label="Pack actif (visible)" />
          </div>
          <div>
            <ImageUpload label="Image du pack" value={edit.image ? productImage(edit.image) : ""} onChange={(v) => setEdit({ ...edit, image: v })} />
          </div>
          <div className="md:col-span-2">
            <p className="eyebrow mb-2">Produits inclus</p>
            <div className="space-y-2">
              {singles.map((p) => {
                const it = edit.bundle_items.find((x) => x.product_id === p.id);
                return (
                  <div key={p.id} className="flex items-center gap-3 text-sm">
                    <input type="checkbox" className="h-4 w-4" checked={!!it} onChange={(e) => setEdit({ ...edit, bundle_items: e.target.checked ? [...edit.bundle_items, { product_id: p.id, quantity: 1 }] : edit.bundle_items.filter((x) => x.product_id !== p.id) })} />
                    <span className="flex-1">{p.name_fr} <span className="text-muted-foreground">· {Number(p.price)} MAD · stock {p.stock}</span></span>
                    {it && <Input type="number" min="1" max="10" className="!w-20" value={it.quantity} onChange={(e) => setEdit({ ...edit, bundle_items: edit.bundle_items.map((x) => x.product_id === p.id ? { ...x, quantity: Math.max(1, Number(e.target.value)) } : x) })} />}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex gap-3 md:col-span-2">
            <button onClick={save} className="btn-lux !px-6 !py-2.5">Enregistrer</button>
            <button onClick={() => setEdit(null)} className="btn-ghost-lux !px-6 !py-2.5">Annuler</button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {packs.map((p, i) => (
          <Card key={p.id} className="flex flex-wrap items-center gap-4 !p-4">
            <img src={productImage(p.image)} alt="" className="h-16 w-16 bg-card object-cover" />
            <div className="min-w-0 flex-1">
              <p className={p.is_active ? "" : "text-muted-foreground line-through"}>{p.name_fr}</p>
              <p className="text-xs text-muted-foreground">{Number(p.price)} MAD{p.free_shipping ? " · livraison gratuite" : ""} · stock {p.stock}{p.is_active ? "" : " · désactivé"}</p>
            </div>
            <button onClick={() => move(i, -1)} className="text-xs link-lux">Monter</button>
            <button onClick={() => move(i, 1)} className="text-xs link-lux">Descendre</button>
            <button onClick={async () => { await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id); refresh(); }} className="text-xs link-lux">{p.is_active ? "Désactiver" : "Activer"}</button>
            <button onClick={() => setEdit({
              id: p.id, name_fr: p.name_fr, name_ar: p.name_ar, tagline_fr: p.tagline_fr, tagline_ar: p.tagline_ar, badge: p.badge,
              price: String(p.price), compare_at_price: p.compare_at_price ? String(p.compare_at_price) : "", free_shipping: p.free_shipping,
              is_active: p.is_active, image: p.image, pack_sort_order: p.pack_sort_order, bundle_items: p.bundle_items as Item[],
            })} className="text-xs link-lux">Modifier</button>
            <button onClick={() => remove(p.id)} className="text-xs text-destructive">Supprimer</button>
          </Card>
        ))}
        {!packs.length && <p className="text-sm text-muted-foreground">Aucun pack.</p>}
      </div>
    </div>
  );
}
