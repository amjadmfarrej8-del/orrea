import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { productImage } from "@/lib/catalog";
import { Card, ImageUpload, Input, PageTitle, Toggle } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/categories")({ head: () => ({ meta: [{ title: "Catégories — Administration ORRÉA" }, { name: "description", content: "Administration ORRÉA : catégories." }, { property: "og:title", content: "Catégories — Administration ORRÉA" }, { property: "og:description", content: "Administration ORRÉA : catégories." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: Categories });

type Cat = { id?: string; slug: string; name_fr: string; name_ar: string; sort_order: number; image: string; is_active: boolean };

function Categories() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin-cats"], queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [] });
  const [draft, setDraft] = useState<Cat>({ slug: "", name_fr: "", name_ar: "", sort_order: 0, image: "", is_active: true });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-cats"] }); qc.invalidateQueries({ queryKey: ["categories"] }); };

  const save = async (c: Cat) => {
    if (!c.name_fr || !c.name_ar) return void toast.error("Noms FR et AR requis");
    const payload = { ...c, slug: c.slug || c.name_fr.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-") };
    const { error } = c.id ? await supabase.from("categories").update(payload).eq("id", c.id) : await supabase.from("categories").insert(payload);
    if (error) return void toast.error(error.message);
    toast.success("Enregistré");
    if (!c.id) setDraft({ slug: "", name_fr: "", name_ar: "", sort_order: 0, image: "", is_active: true });
    refresh();
  };
  const del = async (id: string) => {
    if (!confirm("Supprimer cette catégorie ? Les produits resteront sans catégorie.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message); else refresh();
  };

  return (
    <div>
      <PageTitle title="Catégories" />
      <div className="space-y-4">
        {[...data, draft].map((c, i) => <Row key={c.id ?? "new" + i} initial={c as Cat} onSave={save} onDelete={c.id ? () => del(c.id!) : undefined} />)}
      </div>
    </div>
  );
}

function Row({ initial, onSave, onDelete }: { initial: Cat; onSave: (c: Cat) => void; onDelete?: (() => void) | undefined }) {
  const [c, setC] = useState(initial);
  return (
    <Card className="grid items-end gap-4 md:grid-cols-[auto_1fr_1fr_80px_auto_auto]">
      <ImageUpload label="Image (recadrée 3:4)" crop={3 / 4} value={c.image ? productImage(c.image) : ""} onChange={(v) => setC({ ...c, image: v })} />
      <Input placeholder="Nom FR" value={c.name_fr} onChange={(e) => setC({ ...c, name_fr: e.target.value })} />
      <Input placeholder="Nom AR" dir="rtl" value={c.name_ar} onChange={(e) => setC({ ...c, name_ar: e.target.value })} />
      <Input type="number" title="Ordre" value={c.sort_order} onChange={(e) => setC({ ...c, sort_order: parseInt(e.target.value) || 0 })} />
      <Toggle label="Visible" checked={c.is_active} onChange={(v) => setC({ ...c, is_active: v })} />
      <div className="flex gap-3">
        <button onClick={() => onSave(c)} className="btn-lux !px-4 !py-2">{c.id ? "Enregistrer" : "Ajouter"}</button>
        {onDelete && <button onClick={onDelete} className="text-xs text-destructive">Suppr.</button>}
      </div>
    </Card>
  );
}
